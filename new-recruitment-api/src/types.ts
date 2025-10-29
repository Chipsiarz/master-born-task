export interface Candidate {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experienceYears: number;
  notes?: string;
  status: "nowy" | "w trakcie rozmów" | "zaakceptowany" | "odrzucony";
  consentDate: string;
  offers: number[];
}

