import React, { useContext, createContext } from "react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
} from "thirdweb";
import { sepolia } from "thirdweb/chains";
import {
  useActiveAccount,
  useConnect,
  useSendTransaction,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { parseUnits } from "ethers";

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const contractAddress = "0x6F9A21139611A75Ffc9D3A1af96d838B7Da8d34B";

type StateContextType = {
  address: string | undefined;
  contract: any;
  connect: () => void;
  createCampaign: (form: any) => Promise<void>;
};

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateContextProvider = ({ children }: any) => {
  const account = useActiveAccount();
  const address = account?.address;

  const { connect } = useConnect();
  const handleConnect = () =>
    connect(async () => {
      const wallet = createWallet("io.metamask");
      await wallet.connect({ client });
      return wallet;
    });

  const contract = getContract({
    client,
    chain: sepolia,
    address: contractAddress,
  });

  const { mutateAsync: sendTransaction } = useSendTransaction();

  const publishCampaign = async (form: any) => {
    try {
      const transaction = prepareContractCall({
        contract,
        method:
          "function createCampaign(address _owner, string _title, string _description, uint256 _target, uint256 _deadline, string _image)",
        params: [
          address as string,
          form.title,
          form.description,
          form.target,
          BigInt(new Date(form.deadline).getTime()),
          form.image,
        ],
      });

      const data = await sendTransaction(transaction);
      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect: handleConnect,
        createCampaign: publishCampaign,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
