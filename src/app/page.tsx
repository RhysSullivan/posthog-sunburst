import Image from "next/image";
import { MyResponsiveSunburst, Sidebar } from "./components";

// For AO
// Home page (/)
// Community page (/c/)
// Message page (/m/)
// Search page (/search)
// Other (/*)
// End

export default function Home() {
  return (
    <main className="flex min-h-screen flex-row">
      <Sidebar />
      <div className="flex-grow flex justify-center items-center">
        <div className="w-[800px] h-[800px] text-black">
          <MyResponsiveSunburst />
        </div>
      </div>
    </main>
  );
}
