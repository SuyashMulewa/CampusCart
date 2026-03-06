/**
 * Shared mock bid data and types used by the View Bids pages.
 */
export interface BidderBid {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerMeta: string;
  university: string;
  avatar: string;
  isVerified?: boolean;
  proposedPrice: number;
}

export const bidsByListing: Record<string, BidderBid[]> = {
  p5: [
    {
      id: 'b1',
      buyerId: 'u2',
      buyerName: 'Alex Thompson',
      buyerMeta: 'Engineering Sophomore',
      university: 'Indian Institute of Technology, Delhi',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC7KKMMaX0TilWE2aglMpwSA92J9GrZMY5w2OBh1GKbAmu4BQU2jHKxZjwluQ10eia7HERoDbtQX3wWyENcKM6ut_Srx6GyZ35vbUo3C0avu_5Lc9LdzSKiRG8JhT7RA-iRmjEAvT-nG6R3bVAotTrOKsA_njI2Pc1XJUJGrINM2nbAyXNXR5FsI_MCQ-upLpu0JRliKLE2VHVsXQUHjlI2rEb2a2JVKjqNITSmmX7OICJmvom_p4283lpN8hsCmRGMrz11qTmDrfE',
      proposedPrice: 1200,
      isVerified: true,
    },
    {
      id: 'b2',
      buyerId: 'u3',
      buyerName: 'Sarah Jenkins',
      buyerMeta: 'Mathematics Senior',
      university: 'University of Mumbai',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDCJANhAjzgx2X_eV6eUxkK2dfJ7TupL8Mk8pBjoD_E-YjYWnKvBCMRQ9D9XgA4US5FRY2v1aJTVTtXyUGGO763wucfbfYFS1ZWx1ulE602iN-fNOPanmTClHaVDqnWZtC89eL4ksX8ogfKD2p-8dIwkTA_3InNhWLQpsaF4zZTsVEHTHrq9OFmJp98dLNyJyQYwC3mUzPLA1mKIjRBpDarzJuOQTXOcl4rdNUSMbP_JzBWVVVj9D3jsg9FBkto0YIWTn1fXA3P0XU',
      proposedPrice: 950,
      isVerified: true,
    },
    {
      id: 'b3',
      buyerId: 'u4',
      buyerName: 'Leo Martinez',
      buyerMeta: 'Physics Freshman',
      university: 'Birla Institute of Technology',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCJmiX_e5R7GSqPtihc6PO8Kq_qEuGlIoewyMRJ531Q6bfN14Gc7_wOoQMbvv8KF8JXLcl_UtXoXo1GSJGmTOqTRLlzAHAXQeuqqi1thvUVLpV4lWuZQJF8onU7BRf5qTEym2lz_C5Tw6Uhi2R7Kdw8H3Q-Z55bDxUcKGjh6MknsH51sKF4D4CYj79X3dPMpAvgeOchiWMfeZIB8XPf_79-7BDETDNRbDFwppohdL2a4_MMxSg5LwisIax29HFSQVraLhRDJ2vaXqE',
      proposedPrice: 1300,
    },
  ],
};
