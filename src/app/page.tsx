import Image from "next/image";
import { MyResponsiveSunburst } from "./components";

// For AO
// Home page (/)
// Community page (/c/)
// Message page (/m/)
// Search page (/search)
// Other (/*)
// End

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-[800px] h-[800px] text-black">
        <MyResponsiveSunburst />
      </div>
    </main>
  );
}
