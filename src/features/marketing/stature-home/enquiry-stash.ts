const KEY = "stature-enquiry";

export type StatureEnquiryDraft = {
  interest?: string;
  note?: string;
};

export function stashStatureEnquiry(draft: StatureEnquiryDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  window.dispatchEvent(new Event("stature-enquiry"));
}

export function readStatureEnquiry(): StatureEnquiryDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StatureEnquiryDraft;
  } catch {
    return null;
  }
}
