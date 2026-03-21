-- Migration: init extensions, enums, and shared trigger functions
-- Target: Supabase Postgres

create extension if not exists pgcrypto;

-- Enums mirrored from src/models/enums.ts
create type listing_condition as enum ('New', 'Like New', 'Good', 'Fair', 'Used');
create type listing_status as enum ('active', 'sold', 'pending', 'deleted');
create type bid_status as enum ('pending', 'accepted', 'confirmed', 'completed', 'rejected', 'cancelled', 'expired');
create type order_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type delivery_method as enum ('campus_meetup', 'pickup');
create type meetup_status as enum ('proposed', 'confirmed', 'locked', 'completed', 'cancelled');
create type message_type as enum (
  'text',
  'system',
  'meetup_proposal',
  'meetup_confirmed',
  'otp_generated',
  'otp_verified',
  'bid_notification',
  'price_proposal'
);
create type notification_type as enum ('message', 'order', 'bid', 'listing', 'system');
create type user_role as enum ('student', 'admin');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function normalize_user_email()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(trim(new.email));
  return new;
end;
$$;
