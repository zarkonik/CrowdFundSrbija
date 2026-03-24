import { useContext, createContext } from "react";
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

import { readContract } from "thirdweb";
import { parseEther, formatEther } from "ethers";

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const contractAddress = "0xB2e292EBB70431522b794b32e0581811c43a3e7c"; //don't forget this

type StateContextType = {
  address: string | undefined;
  contract: any;
  connect: () => void;
  createCampaign: (form: any) => Promise<void>;
  getCampaigns: () => Promise<any[]>;
  getUserCampaigns: () => Promise<any[]>;
  donate: (pId: any, amount: any) => Promise<any>;
  getDonations: (pId: any) => Promise<any[]>;
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
          BigInt(Math.floor(new Date(form.deadline).getTime() / 1000)),
          form.image,
        ],
      });

      const data = await sendTransaction(transaction);
      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const getCampaigns = async () => {
    if (!contract) return []; // 👈 guard

    const campaigns = await readContract({
      contract,
      method:
        "function getCampaigns() view returns ((address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountCollected, string image)[])",
      params: [],
    });

    const parsedCampaigns = (campaigns as any[]).map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: formatEther(campaign.target),
      deadline: Number(campaign.deadline),
      amountCollected: formatEther(campaign.amountCollected),
      image: campaign.image,
      pId: i,
    }));

    return parsedCampaigns;
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address,
    );

    return filteredCampaigns;
  };

  const donate = async (pId: any, amount: any) => {
    const transaction = prepareContractCall({
      contract,
      method: "function donateToCampaign(uint256 _id) payable",
      params: [BigInt(pId)],
      value: parseEther(amount),
    });

    const data = await sendTransaction(transaction);
    return data;
  };

  const getDonations = async (pId: any) => {
    if (!contract) return [];

    const donations = await readContract({
      contract,
      method:
        "function getDonators(uint256 _id) view returns (address[], uint256[])",
      params: [BigInt(pId)],
    });

    const numberOfDonations = donations[0].length;
    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: formatEther(donations[1][i]),
      });
    }

    return parsedDonations;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect: handleConnect,
        createCampaign: publishCampaign,
        getCampaigns: getCampaigns,
        getUserCampaigns: getUserCampaigns,
        donate: donate,
        getDonations: getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
