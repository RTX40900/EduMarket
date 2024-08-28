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
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";

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
  

const BuyCourses: React.FC = () => {
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
  
    const fetchCourses = async () => {
        if (contracts) {
          try {
            // Fetch total course count from the contract
            const courseCount = await contracts.methods.courseCount().call();
            console.log("Total number of courses:", courseCount);
      
            const fetchedCourses = [];
            // Loop through all courses using the total course count
            for (let i = 0; i < courseCount; i++) {
              const course = await contracts.methods.getCourse(i).call();
              fetchedCourses.push({
                id: i,
                title: course.title,
                description: course.description,
                price: Web3.utils.fromWei(course.price, 'ether'),
                author: course.author
              });
            }
      
            // Set the fetched courses in your state or UI
            setCourses(fetchedCourses);
          } catch (error) {
            console.error("Failed to fetch courses:", error);
          }
        }
      };

  const purchaseCourse = async (courseId: number, price: string) => {
    if (contracts && web3) {
      try {
        const priceWei = web3.utils.toWei(price, "ether");
        await contracts.methods.purchaseCourse(courseId).send({
          from: accountAddress,
          value: priceWei,
          gas: 30000,
        });
        alert("Course purchased successfully!");
      } catch (error) {
        console.error("Failed to purchase course:", error);
      }
    }
  };


  const giftCourse = async (courseId: number, price: string) => {
    if (contracts && web3) {
      try {
        const recipientAddress = prompt("Enter the recipient's Ethereum address:");
        if (recipientAddress) {
          const priceWei = web3.utils.toWei(price, "ether");
          await contracts.methods.giftCourse(courseId, recipientAddress).send({
            from: accountAddress,
            value: priceWei,
            gas: 30000
          });
          alert("Course gifted successfully!");
        }
      } catch (error) {
        console.error("Failed to gift course:", error);
      }
    }
  };
  useEffect(() => {

    if (isConnected) {
      fetchCourses();
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
                <h2 className="text-2xl font-bold mb-4">Available Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map((course) => (
                    <div key={course.id} className="border p-4 rounded shadow-md">
                      <h3 className="text-xl font-bold">{course.title}</h3>
                      <p className="mt-2">{course.description}</p>
                      <p className="mt-2">Price: {course.price} EDU</p>
                      <div className="mt-4">
                        <Button
                          className="mr-2"
                          onClick={() => purchaseCourse(course.id, course.price)}
                        >
                          Purchase
                        </Button>
                        <Button onClick={() => giftCourse(course.id, course.price)}>
                          Gift
                        </Button>
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

export default BuyCourses;