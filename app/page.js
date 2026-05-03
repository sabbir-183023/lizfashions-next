import Image from "next/image";
import WelcomeText from "./components/home/WelcomeText";
import Slides from "./components/home/Slide";

export default function Home() {
  return (
    <div>
      <div className="isolate-slides hardware-accelerated">
        <Slides />
      </div>
      {/* Welcome text */}
      <WelcomeText/>
    </div>
  );
}
