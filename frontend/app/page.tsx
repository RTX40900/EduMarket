"use client";
import React, { useState, useEffect } from "react";
import Web3 from "web3";
import contractJson from "@/contracts/CourseStorage.sol/CourseStorage.json";
import { Button } from "@/components/ui/button";
import LoginButton from "@/components/LoginButton";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import { jwtDecode } from "jwt-decode";
import { Contracts } from "@/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CourseStorageContractAddress } from "./constants";

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

const App: React.FC = () => {
  const { authState } = useOCAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accountAddress, setAccountAddress] = useState<string | undefined>(
    undefined
  );
  const [displayMessage, setDisplayMessage] = useState<string>("");
  const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
  const [contracts, setContracts] = useState<Contracts | undefined>(undefined);
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

  const purchaseCourse = async (courseId: number, price: string) => {
    if (contracts && web3) {
      try {
        setLoading(true);
        const priceWei = web3.utils.toWei(price, 'ether');
        const transaction = await contracts.methods.purchaseCourse(courseId).send({
          from: accountAddress,
          value: priceWei,
          gas: 30000
        });
        setTxnHash(transaction.transactionHash);
        setShowMessage(true);
        setDisplayMessage("Course purchased successfully!");
        fetchOwnedCourses();
      } catch (error) {
        console.error("Failed to purchase course:", error);
        setDisplayMessage("Failed to purchase course.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchCourses();
      fetchOwnedCourses();
    }
  }, [isConnected]);

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


  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          {!ocidUsername && (
            <div className="max-w-md mx-auto p-8 bg-white shadow-lg rounded-lg">
              <h1 className="text-3xl font-semibold text-center mb-8">Welcome to EduMarket</h1>
              <div className="flex justify-center">
                <LoginButton />
              </div>
            </div>
          )}
          {ocidUsername && (
            <div className="max-w-7xl mx-auto">
                                <h1 className="text-4xl font-bold mb-8 text-center">
                                    Welcome, <span className="text-indigo-600">{ocidUsername}</span>!
                                </h1>
              {!isConnected && (
                <div className="max-w-md mx-auto p-8 bg-white shadow-lg rounded-lg text-center">
                  <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
                  <Button
                    className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md"
                    onClick={ConnectWallet}
                  >
                    Connect with MetaMask
                  </Button>
                </div>
              )}
              {isConnected && (
                <>
                  <section className="mb-16">
                    <h3 className="text-2xl font-semibold mb-4">Available Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {courses.map((course) => (
                        <div key={course.id} className="bg-white p-6 rounded-lg shadow-lg">
                          <h4 className="text-xl font-semibold mb-2">{course.title}</h4>
                          <p className="text-gray-600 mb-4">{course.description}</p>
                          <p className="text-gray-800 font-medium">Price: {course.price} EDU</p>
                          <p className="text-gray-400 font-sm mb-4">
                            Author: {course.author?.slice(0, 10)}...
                          </p>
                          {!ownedCourses.includes(course.id) && (
                            <div className="space-x-2">
                              <Button
                                className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-md"
                                onClick={() => purchaseCourse(course.id, course.price)}
                              >
                                Purchase
                              </Button>
                              <Button
                                variant="outline"
                                className="text-indigo-600 border-indigo-600 font-medium py-2 px-4 rounded-md"  
                                onClick={() => giftCourse(course.id, course.price)}
                              >
                                Gift
                              </Button>
                            </div>
                          )}
                          {ownedCourses.includes(course.id) && (
                            <span className="text-green-600 font-medium">Owned</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-2xl font-semibold mb-4">My Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {ownedCourses.map((course) => (
                        <div key={course.id} className="bg-white p-6 rounded-lg shadow-md">
                          <h4 className="text-xl font-semibold mb-2">{course.title}</h4>
                          <p className="text-gray-600 mb-4">{course.description}</p>
                          <p className="text-gray-400 font-sm mb-4">
                            Author: {course.author?.slice(0, 10)}...
                          </p>
                          <Button 
                            className="bg-indigo-600 text-white font-medium py-2 px-4 rounded-md"
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
    </>
  );
}

export default App;


