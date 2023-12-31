import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { RxDotFilled } from "react-icons/rx";
import dynamic from "next/dynamic";
import { RootState } from "~/redux/store";
import { useSelector } from "react-redux";

const NFTList = dynamic(() => import("../components/mainTab/Maintab"), {
  ssr: false,
});
// Define the correct typing for userPage
export default function Home() {
  const { smartAccount } = useSelector(
    (state: RootState) => state.smartAccountSlice as any,
  );
  const router = useRouter();
  const slides = [
    {
      url: "/yellow.png",
    },
    {
      url: "/galaxyNFT.png",
    },
    {
      url: "/trippy.gif",
    },
    {
      url: "/colours.png",
    },
    {
      url: "/yinyang.gif",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: any) => {
    setCurrentIndex(slideIndex);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);
  useEffect(() => {
    let isUser: any = JSON.parse(localStorage.getItem("user") as any);
    // setUser(isUser)

    if (!isUser) {
      router.push("/login");
    } else {
      console.log("smartAccount : ", smartAccount);
      if (!smartAccount) {
        // loginHandle()
        console.log("hello Undefeined..");
      }
    }
  }, []);

  return (
    <>
      <Head>
        <title>NFTrops</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/mainlogo.png" />
      </Head>
      <div className="bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300">
        <div className="group ">
          <div className="m-auto h-[460px] w-full max-w-[1400px] px-4 pb-4 pt-16">
            <div
              style={{
                backgroundImage: `url(${slides[currentIndex]?.url})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
              className="h-[400px] w-full rounded-2xl bg-cover bg-center duration-500 md:h-[350px]"
            ></div>
          </div>
          <div className="top-4 flex w-[1400] justify-center py-2">
            {slides.map((slide, slideIndex) => (
              <div
                key={slideIndex}
                onClick={() => goToSlide(slideIndex)}
                className="cursor-pointer text-2xl"
              >
                <RxDotFilled />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-32">
        <NFTList />
      </div>
    </>
  );
}
