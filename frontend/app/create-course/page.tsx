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

  const createCourse = async () => {
    if (contracts && web3) {
      try {
        setLoading(true);
        console.log("new Course price: ", newCourse.price);
        const priceWei = web3.utils.toWei(newCourse.price, 'ether');
        console.log(priceWei);
        console.log("Price in Wei:", priceWei);
        const transaction = await contracts.methods.addCourse(
          newCourse.title,
          newCourse.description,
          newCourse.content,
          priceWei
        ).send({ from: accountAddress, gas: 300000 });
        setTxnHash(transaction.transactionHash);
        setShowMessage(true);
        setDisplayMessage("Course created successfully!");
        fetchCourses();
      } catch (error) {
        console.error("Failed to create course:", error);
        setDisplayMessage("Failed to create course.");
      } finally {
        setLoading(false);
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
            {!isConnected && (
              <Card className="w-full max-w-2xl p-8 shadow-lg" style={{ margin: 'auto' }}>
                <CardHeader>
                  <CardTitle className="text-center text-4xl font-bold mt-4">
                    Create Course
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
              <Card className="w-full max-w-2xl p-8 shadow-lg" style={{ margin: 'auto' }}>
                <CardHeader>
                  <CardTitle className="text-center text-4xl font-bold mt-4">
                    Create Course
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center mt-4 space-y-6">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <textarea
                    placeholder="Description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    rows={4}
                  ></textarea>
                  <textarea
                    placeholder="Content (Markdown)"
                    value={newCourse.content}
                    onChange={(e) => setNewCourse({ ...newCourse, content: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                    rows={8}
                  ></textarea>
                  <input
                    type="text"
                    placeholder="Price (in EDU)"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <Button
                    className="bg-teal-400 hover:bg-teal-700 text-black font-bold py-2 px-4 rounded-md"
                    onClick={createCourse}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Course"}
                  </Button>
                  {showMessage && (
                    <p className="text-green-500">{displayMessage}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
export default MyCourses;