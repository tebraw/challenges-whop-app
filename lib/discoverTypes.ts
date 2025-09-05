export interface ChallengeMeta {
  public: boolean;              // ob in Discover gelistet
  title: string;                // Challenge- oder Instanz-Titel
  bannerUrl?: string;           // Bild für Card
  cadence?: "DAILY" | "END";    // tägliche Proofs vs. finaler Proof
  planId?: string;              // Whop Plan für Checkout
  affiliateUsername?: string;   // Affiliate des Ziel-Creators (Whop-Username)
  promoUrl?: string;            // Fallback-Link (Produkt/Experience)
}

export interface DiscoverCard {
  id: string;
  title: string;
  bannerUrl?: string;
  planId?: string;
  affiliateUsername?: string;
  promoUrl?: string;
  communityName?: string;
  hasAccess?: boolean;
}

export interface WhopExperience {
  id: string;
  name: string;
  metadata?: ChallengeMeta;
  company?: {
    name: string;
  };
}

export interface WhopCheckoutSession {
  checkout_url?: string;
  url?: string;
}
