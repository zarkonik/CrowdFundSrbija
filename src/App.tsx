import { ConnectButton } from "thirdweb/react";
import { client, activeChain } from "./client";

export default function App() {
  return (
    <div>
      <h1>My ThirdWeb App</h1>
      <ConnectButton client={client} chains={[activeChain]} />
    </div>
  );
}
