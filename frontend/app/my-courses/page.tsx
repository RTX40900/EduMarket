'use client';
import React, { useState, useEffect } from "react";
import contractJson from "@/contracts/CourseStorage.sol/CourseStorage.json";
import { Contracts } from "@/types";
import { Button } from "@/components/ui/button";
import { CourseStorageContractAddress } from "@/app/constants";
import { useWallet } from "../WalletContext";
import Web3 from "web3";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import { jwtDecode } from "jwt-decode";
import LoginButton from "@/components/LoginButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
}


interface DecodedToken {
    edu_username: string;
    [key: string]: any;
  }
  
  interface Course {
    id: number;
    title: string;
    description: string;
    price: string;
    markdownContent?: string;
  }
  

const MyCourses: React.FC = () => {
    const { authState } = useOCAuth();
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [accountAddress, setAccountAddress] = useState<string | undefined>(
      undefined
    );
    const [displayMessage, setDisplayMessage] = useState<string>("");
    const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
    const [contracts, setContracts] = useState<Contracts | undefined>(undefined);
    // const [getNetwork, setGetNetwork] = useState<number | undefined>(undefined);
    // const [mmStatus, setMmStatus] = useState<string>("Not connected!");
    // const [contractAddress, setContractAddress] = useState<string | undefined>(
    //   undefined
    // );
    const [loading, setLoading] = useState<boolean>(false);
    const [txnHash, setTxnHash] = useState<string | null>(null);
    const [showMessage, setShowMessage] = useState<boolean>(false);
    const [ocidUsername, setOcidUsername] = useState<string | null>(null);
  
    const [courses, setCourses] = useState<Course[]>([]);
    const [ownedCourses, setOwnedCourses] = useState<Course[]>([]);
    const [newCourse, setNewCourse] = useState({ title: "", description: "", content: "", price: "" });
  
    useEffect(() => {
      if (authState.idToken) {
        const decodedToken = jwtDecode<DecodedToken>(authState.idToken);
        setOcidUsername(decodedToken.edu_username);
      }
  
      (async () => {
        try {
          if (typeof window.ethereum !== "undefined") {
            const web3 = new Web3(window.ethereum);
            setWeb3(web3);
            const networkId: any = await web3.eth.getChainId();
            const contractAddress = CourseStorageContractAddress;
            // setGetNetwork(networkId);
            // setContractAddress(CourseStorageContractAddress);
            const CourseStorage = new web3.eth.Contract(
              contractJson.abi,
              contractAddress
            ) as Contracts;
            setContracts(CourseStorage);
            CourseStorage.setProvider(window.ethereum);
          } else {
            alert("Please install MetaMask!");
          }
        } catch (error) {
          console.error("Failed to initialize web3 or contract:", error);
        }
      })();
    }, [authState.idToken]);
  
    const ConnectWallet = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          if (chainId !== "0xa045c") {
            alert(
              `Please connect to the "Open Campus Codex" network in Metamask.`
            );
            return;
          }
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          setAccountAddress(accounts[0]);
          // setMmStatus("Connected!");
          setIsConnected(true);
        } catch (error) {
          console.error("Failed to connect to wallet:", error);
        }
      } else {
        alert("Please install MetaMask!");
      }
    };
  

      const fetchOwnedCourses = async () => {
        if (contracts && accountAddress) {
          try {
            const owned = await contracts.methods.getOwnedCourses(accountAddress).call();
            console.log(`Owned courses: ${owned}, ${owned.length}`)
            const fetchedCourses: Course[] = [];
            for (let i = 0; i < owned.length; i++) {
              const courseId = owned[i];
              const course = await contracts.methods.getCourse(courseId).call();
              console.log(`Course: ${course.title}`)
              fetchedCourses.push({
                id: courseId,
                title: course.title,
                description: course.description,
                price: Web3.utils.fromWei(course.price, 'ether'),
                markdownContent: course.markdownContent
              });
            }
            setOwnedCourses(fetchedCourses);
            console.log(`Owned courses: ${ownedCourses}`)
          } catch (error) {
            console.error("Failed to fetch owned courses:", error);
          }
        }
      };

  useEffect(() => {

    if (isConnected) {
      fetchOwnedCourses();
      console.log(`Owned courses: ${ownedCourses}`)
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between">
      <Header />
      <div className="flex flex-col items-center justify-center flex-grow w-full mt-24 px-4">
        {!ocidUsername && <LoginButton />}
        {ocidUsername && (
          <div className="max-w-4xl w-full">
            <div className="text-center text-xl mb-8">
              <h1>
                👉Welcome,{" "}
                <a href="/user">
                  <strong>{ocidUsername}👈</strong>
                </a>{" "}
              </h1>
            </div>
            {!isConnected && (
              <Card className="w-full max-w-2xl p-8 shadow-lg" style={{ margin: 'auto' }}>
                <CardHeader>
                  <CardTitle className="text-center text-4xl font-bold mt-4">
                    EduMarket
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center mt-4 space-y-6">
                  <Button
                    className="bg-teal-400 hover:bg-teal-700 text-black font-bold py-2 px-4 rounded-md mb-4"
                    onClick={ConnectWallet}
                    variant="link"
                  >
                    Connect with MetaMask
                  </Button>
                </CardContent>
              </Card>
            )}
            {isConnected && (
              <>
              <h2 className="text-2xl font-bold mb-4">My Courses</h2>
              <div className="space-y-8">
                {ownedCourses.map((course) => (
                  <div key={course.id} className="border p-4 rounded shadow-md">
                    <h3 className="text-xl font-bold">{course.title}</h3>
                    <p className="mt-2">{course.description}</p>
                    <p className="mt-2">Price: {course.price} ETH</p>
                    <div className="mt-4 prose">
                      {course.markdownContent && <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                      {course.markdownContent.replace(
        /https:\/\/youtu\.be\/(\w+)/g,
        '<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameBorder="0" allowFullScreen></iframe>'
      )}
                        </ReactMarkdown>}
                    </div>
                  </div>
                ))}
              </div>
            </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyCourses;