import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { api } from "~/utils/api";
import { Button } from "../ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../ui/ui/dialog";
import { useSelector } from "react-redux";
import { RootState } from "~/redux/store";
import {
  IHybridPaymaster,
  PaymasterMode,
  SponsorUserOperationDto,
  PaymasterFeeQuote,
} from "@biconomy/paymaster";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { CallTracker } from "assert";
import { transferTokens } from "~/server/web3/transfertoken";
import {
  ERC20_ABI,
  NFT_ABI,
  NFT_Contract_Address,
  USDC_Contract_Address,
} from "~/utils/contants";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setFetchedBalance } from "~/redux/Features/balanceSlice";
import { fetchData } from "~/utils/helper-function";
const StripeForm = ({
  isModal,
  setIsModal,
  nft,
  setBankTransfer,
  refetch,
}: any) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { smartAccount } = useSelector(
    (state: RootState) => state.smartAccountSlice as any,
  );
  console.log("Smart Account1", smartAccount);

  console.log(nft, "1 nft record");
  const elements: any = useElements();
  const stripe: any = useStripe();
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState({
    id: "",
    wallet_address: "",
  });

  const updateBUy = api.nft.updateBuyNFT.useMutation({
    onSuccess: (res: any) => {
      console.log(res, "Login result");
      if (res) {
        toast.success("NFT Bought Successfully!", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });

        router.push("/mynfts");
        setIsLoading(false);
      }
    },
    onError: (err: any) => {
      toast.error(err, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setIsLoading(false);
      console.log(err.message, "NFT Creation Error");
    },
  });
  const BuyToken = async (fromAddress: any, toAddress: any, amount: any) => {
    try {
      let bal = await transferTokens({
        fromAddress: fromAddress,
        toAddress: toAddress,
        amount: amount,
      });
      // You can process the balance here as needed
      console.log(bal);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };
  useEffect(() => {
    let isUser: any = JSON.parse(localStorage.getItem("user") as any);
    setUser(isUser);
  }, []);

  console.log(nft.price, "nft.store_id");
  console.log(user);

  const handleSubmit = async (e: any) => {
    setBtnDisabled(true);
    setIsLoading(true);
    e.preventDefault();
    if (
      user.wallet_address.toLocaleLowerCase() ===
      nft.nft_owner.toLocaleLowerCase()
    ) {
      () => setIsModal(false);
      toast.error("Cannot Buy Your Own NFT!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setIsLoading(false);
      return;
    }
    const { token, error } = await stripe.createToken(
      elements.getElement(CardElement),
    );
    console.log(token, error, "token, error");

    if (error !== undefined) {
      setBtnDisabled(true);
      setTimeout(function () {
        setBtnDisabled(false);
      }, 2000);

      toast.error("ERROR!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } else {
      const obj = {
        token: token.id,
        price: +nft.price,
      };
      console.log(obj, "object in stripe form");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}paymentIntent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(obj),
          },
        );
        console.log({ response }, "response");

        if (!response.ok) {
          throw new Error("API request failed");
        }
        const TokenResponse = await BuyToken(
          "0xEdb8373211332CC6F141CEBB7B8587C7CFb68243",
          user.wallet_address,
          Number(nft.price) * 1000000,
        );
        if (TokenResponse) {
          const transferResponse = await BuyNFT(nft.token_id, nft.price);
          if (transferResponse?.sucess) {
            let value: any = {
              token_id: nft.token_id,
              wallet_address: user.wallet_address,
              owner_id: user.id,
            };
            let response = await updateBUy.mutateAsync(value);
            console.log("Response", response);
            const balance = await fetchData(user.wallet_address);
            if (balance) {
              dispatch(setFetchedBalance(balance));
            }
          }
        }
        setIsModal(false);
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    }
  };

  async function BuyNFT(tokenId: any, price: any) {
    try {
      console.log("smart Account in add nft: ", smartAccount);

      if (!smartAccount) {
        // Handle the case when smartAccount is undefined
        throw new Error("smartAccount is undefined");
      }

      const readProvider = await smartAccount.provider;
      console.log("RPC PROVIDER", readProvider);
      const nftcontract = new ethers.Contract(
        NFT_Contract_Address,
        NFT_ABI,
        readProvider,
      );

      const erc20Contract = new ethers.Contract(
        USDC_Contract_Address,
        ERC20_ABI,
        readProvider,
      );
      // Check if contract.populateTransaction and safeMint are defined
      if (
        !nftcontract.populateTransaction ||
        !nftcontract.populateTransaction.buy
      ) {
        throw new Error("Buy is not defined");
      }

      if (
        !erc20Contract.populateTransaction ||
        !erc20Contract.populateTransaction.approve
      ) {
        throw new Error("approve is not defined");
      }
      console.log("NFT DATA", typeof tokenId, typeof price, "....check trace");
      const approveprice = Number(price) * 1000000;
      const populateTxn = await erc20Contract.populateTransaction.approve(
        "0xCF9c48cB6d68413714eceF716949a3fCbca32A9c",
        approveprice,
      );
      const tx1 = {
        to: USDC_Contract_Address,
        data: populateTxn.data,
      };
      const populatedTxn1 = await nftcontract.populateTransaction.buy(
        Number(tokenId),
        approveprice,
      );
      const tx2 = {
        to: NFT_Contract_Address,
        data: populatedTxn1.data,
      };

      console.log("here before userop");
      let userOp = await smartAccount?.buildUserOp([tx1, tx2]);
      console.log("userop", { userOp });
      const biconomyPaymaster =
        smartAccount?.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      console.log(biconomyPaymaster);
      console.log(smartAccount);
      let paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
      };
      console.log("check...");
      const paymasterAndDataResponse =
        await biconomyPaymaster.getPaymasterAndData(
          userOp,
          paymasterServiceData,
        );
      console.log("Hello2", paymasterAndDataResponse);

      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
      console.log("Hello3");
      const userOpResponse = await smartAccount?.sendUserOp(userOp);
      console.log("Hello4", userOpResponse);
      console.log("userOpHash buy", userOpResponse);
      const { receipt } = await userOpResponse.wait(1);
      console.log("txHash", receipt.transactionHash);
      return { sucess: true, transaction_hash: receipt.transactionHash };
    } catch (err) {
      console.error(err);
      console.log(err);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsModal(true)}>
          Bank Transfer{" "}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>
        <form>
          <CardElement />
        </form>
        <DialogFooter>
          {btnDisabled ? (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buy NFT
            </Button>
          ) : (
            <Button
              className="rounded-xl bg-green-300"
              color="temp-10"
              type="submit"
              onClick={handleSubmit}
            >
              Buy NFT
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <ToastContainer />
    </Dialog>
  );
};

export default StripeForm;
