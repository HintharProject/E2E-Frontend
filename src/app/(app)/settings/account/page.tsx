import { UserProfile } from "@clerk/nextjs";

export default function AccountSettingsPage() {
  return (
    <div className="flex justify-center w-full">
      <UserProfile 
        routing="hash"
        appearance={{
          elements: {
            rootBox: "w-full max-w-4xl",
            card: "shadow-none border border-line bg-card w-full rounded-2xl",
            navbar: "hidden", // We can hide the navbar if we want, or keep it. Let's keep it default.
          }
        }}
      />
    </div>
  );
}
