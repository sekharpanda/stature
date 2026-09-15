import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ListingForm } from "@/features/portal/components/listing-form";

export const metadata = {
  title: "Add Listing",
  robots: { index: false, follow: false },
};

export default function NewPortalListingPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agent portal</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Add listing</h1>
          <p className="mt-2 text-muted-foreground">
            Fill in what you know, save a draft any time, and submit when it is
            ready for approval.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/my/listings">Back to my listings</Link>
        </Button>
      </div>

      <ListingForm
        live={false}
        values={{
          propertyId: null,
          name: "",
          propertyTypeName: null,
          categoryName: null,
          developerName: null,
          cityName: "Dubai",
          areaName: null,
          communityName: null,
          addressLine: null,
          currency: "AED",
          price: null,
          maxPrice: null,
          bedrooms: null,
          minSize: null,
          maxSize: null,
          completionLabel: null,
          saleStatus: null,
          shortDescription: null,
          description: null,
          amenities: [],
          coverImageUrl: null,
          galleryUrls: [],
          youtubeUrl: null,
          metaTitle: null,
          metaDescription: null,
        }}
      />
    </div>
  );
}
