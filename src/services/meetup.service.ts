/**
 * Meetup service — scheduling and confirming physical meetups (Supabase-backed).
 */
import { eventBus } from '@/events/eventBus';
import { EVENTS } from '@/events/events';
import { supabase } from '@/lib/supabase';
import { getCurrentUserId } from './auth.service';
import { confirm as confirmOrder } from './order.service';
import { generate as generateOtp } from './otp.service';
import { sendSystemMessage } from './chat.service';
import type { Meetup, ProposeMeetupDTO } from '@/models/meetup.model';
import { simulateLatency, wrapResponse, throwApiError } from './base.service';

const MEETUP_SELECT = `
  id,
  orderId:order_id,
  conversationId:conversation_id,
  location,
  date,
  time,
  proposedBy:proposed_by,
  buyerConfirmed:buyer_confirmed,
  sellerConfirmed:seller_confirmed,
  isLocked:is_locked,
  status,
  createdAt:created_at,
  updatedAt:updated_at
`;

function toMeetup(row: any): Meetup {
  return {
    id: row.id,
    orderId: row.orderId,
    conversationId: row.conversationId,
    location: row.location,
    date: row.date,
    time: typeof row.time === 'string' ? row.time.slice(0, 5) : row.time,
    proposedBy: row.proposedBy,
    buyerConfirmed: !!row.buyerConfirmed,
    sellerConfirmed: !!row.sellerConfirmed,
    isLocked: !!row.isLocked,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function propose(dto: ProposeMeetupDTO) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id')
    .eq('id', dto.orderId)
    .single();

  if (orderError || !order) throwApiError(404, 'Order not found');

  const { data: existing } = await supabase
    .from('meetups')
    .select(MEETUP_SELECT)
    .eq('order_id', dto.orderId)
    .maybeSingle();

  if (existing && existing.status !== 'cancelled') {
    const { data: updatedRow, error: updateError } = await supabase
      .from('meetups')
      .update({
        location: dto.location,
        date: dto.date,
        time: dto.time,
        proposed_by: userId,
        buyer_confirmed: false,
        seller_confirmed: false,
        is_locked: false,
        status: 'proposed',
      })
      .eq('id', existing.id)
      .select(MEETUP_SELECT)
      .single();

    if (updateError || !updatedRow) {
      throwApiError(500, updateError?.message || 'Failed to update meetup');
    }

    await sendSystemMessage(
      dto.conversationId,
      `📍 Meetup Details Updated\n📌 ${dto.location}\n📅 ${dto.date}\n⏰ ${dto.time}`,
      'meetup_proposal',
      { location: dto.location, date: dto.date, time: dto.time, isMeetup: true, proposedBy: userId, actorId: userId },
    );

    eventBus.emit(EVENTS.MEETUP_PROPOSED, {
      meetupId: existing.id,
      orderId: dto.orderId,
      conversationId: dto.conversationId,
    });

    return wrapResponse(toMeetup(updatedRow));
  }

  const { data: createdRow, error: createError } = await supabase
    .from('meetups')
    .insert({
      order_id: dto.orderId,
      conversation_id: dto.conversationId,
      location: dto.location,
      date: dto.date,
      time: dto.time,
      proposed_by: userId,
      buyer_confirmed: false,
      seller_confirmed: false,
      is_locked: false,
      status: 'proposed',
    })
    .select(MEETUP_SELECT)
    .single();

  if (createError || !createdRow) {
    throwApiError(500, createError?.message || 'Failed to create meetup');
  }

  await sendSystemMessage(
    dto.conversationId,
    `📍 Meetup Details\n📌 ${dto.location}\n📅 ${dto.date}\n⏰ ${dto.time}`,
    'meetup_proposal',
    { location: dto.location, date: dto.date, time: dto.time, isMeetup: true, proposedBy: userId, actorId: userId },
  );

  eventBus.emit(EVENTS.MEETUP_PROPOSED, {
    meetupId: createdRow.id,
    orderId: dto.orderId,
    conversationId: dto.conversationId,
  });

  return wrapResponse(toMeetup(createdRow));
}

export async function confirm(meetupId: string) {
  await simulateLatency(100, 200);

  const userId = getCurrentUserId();
  if (!userId) throwApiError(401, 'Must be logged in');

  const { data: currentMeetup, error: meetupError } = await supabase
    .from('meetups')
    .select(MEETUP_SELECT)
    .eq('id', meetupId)
    .single();

  if (meetupError || !currentMeetup) throwApiError(404, 'Meetup not found');

  const meetup = toMeetup(currentMeetup);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id')
    .eq('id', meetup.orderId)
    .single();

  if (orderError || !order) throwApiError(404, 'Associated order not found');

  const role = order.buyer_id === userId ? 'buyer' : 'seller';

  const { data: updatedRows, error: confirmError } = await supabase.rpc('confirm_meetup_by_user', {
    p_meetup_id: meetupId,
    p_user_id: userId,
  });

  if (confirmError || !updatedRows || !Array.isArray(updatedRows) || updatedRows.length === 0) {
    throwApiError(400, confirmError?.message || 'Could not confirm meetup');
  }

  const updated = toMeetup(updatedRows[0]);

  await sendSystemMessage(
    meetup.conversationId,
    `✅ ${role === 'buyer' ? 'Buyer' : 'Seller'} confirmed the meetup!`,
    'system',
    { actorId: userId },
  );

  eventBus.emit(EVENTS.MEETUP_CONFIRMED, {
    meetupId,
    orderId: meetup.orderId,
    conversationId: meetup.conversationId,
  });

  if (updated.isLocked) {
    await confirmOrder(meetup.orderId);
    await generateOtp(meetupId, meetup.orderId);

    eventBus.emit(EVENTS.MEETUP_LOCKED, {
      meetupId,
      orderId: meetup.orderId,
      conversationId: meetup.conversationId,
    });
  }

  return wrapResponse(updated);
}

export async function getByOrder(orderId: string) {
  await simulateLatency(50, 100);

  const { data, error } = await supabase
    .from('meetups')
    .select(MEETUP_SELECT)
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) throwApiError(500, error.message);
  return wrapResponse(data ? toMeetup(data) : null);
}
