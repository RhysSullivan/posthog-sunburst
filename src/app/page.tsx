import Image from "next/image";
import { MyResponsiveSunburst, Sidebar } from "./components";

// For AO
// Home page (/)
// Community page (/c/)
// Message page (/m/)
// Search page (/search)
// Other (/*)
// End

// SQL Query to write:
// Get session_id, page, timestamp group by session_id

// | row 1
// | row 2
// | row 3

// for each row in the result of the above query
// count the page by some regex

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
