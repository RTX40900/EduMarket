'use client';
import React, { useState, useEffect } from "react";
import contractJson from "@/contracts/CourseStorage.sol/CourseStorage.json";
import { Contracts } from "@/types";
import { Button } from "@/components/ui/button";
import { CourseStorageContractAddress } from "@/app/constants";
import Web3 from "web3";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import { jwtDecode } from "jwt-decode";
import LoginButton from "@/components/LoginButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
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
  author?: string;
}


const MyCourses: React.FC = () => {
  const { authState } = useOCAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accountAddress, setAccountAddress] = useState<string | undefined>(
    undefined
  );
  const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
  const [contracts, setContracts] = useState<Contracts | undefined>(undefined);
  const [ocidUsername, setOcidUsername] = useState<string | null>(null);

  const [ownedCourses, setOwnedCourses] = useState<Course[]>([]);

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
            markdownContent: course.markdownContent,
            author: course.author
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        {!ocidUsername && <LoginButton />}
        {ocidUsername && (
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">
              Welcome, <span className="text-indigo-600">{ocidUsername}</span>!
            </h1>
            {!isConnected && (
              <Card className="max-w-md mx-auto p-8 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center mb-4">
                    Connect Your Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button
                    className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md"
                    onClick={ConnectWallet}
                  >
                    Connect with MetaMask
                  </Button>
                </CardContent>
              </Card>
            )}
            {isConnected && (
              <>
                <section className="mb-16">
                  <h2 className="text-3xl font-bold mb-8">My Courses</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ownedCourses.map((course) => (
                      <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                        <p className="text-gray-600 mb-4">{course.description}</p>
                          <p className="text-gray-400 font-sm mb-4">Author: {course.author?.slice(0, 10)}...</p>
                        <Button
                          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md"
                          onClick={() => window.location.href = `/course/${course.id}`}
                        >
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyCourses;