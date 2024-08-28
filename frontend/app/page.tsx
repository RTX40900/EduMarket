"use client";
import React, { useState, useEffect } from "react";
import Web3 from "web3";
// import contractJson from "@/contracts/Greeter.sol/Greeter.json";
import contractJson from "@/contracts/CourseStorage.sol/CourseStorage.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const createCourse = async () => {
    if (contracts && web3) {
      try {
        setLoading(true);
        const priceWei = web3.utils.toWei(newCourse.price, 'ether');
        console.log(priceWei);
        console.log("converting to eth")
        console.log(typeof priceWei);
        const transaction = await contracts.methods.addCourse(
          newCourse.title,
          newCourse.description,
          newCourse.content,
          Web3.utils.fromWei(priceWei, 'ether')
        ).send({ from: accountAddress, gas: 3000000 });
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
      <div className="min-h-screen flex flex-col items-center justify-between">
        <Header />
        <div className="flex flex-col items-center justify-center flex-grow w-full mt-24 px-4">
          {!ocidUsername && (
            <div className="max-w-2xl w-full p-8 shadow-lg rounded-lg">
              <div className="flex justify-center mt-8">
                <LoginButton />
              </div>
            </div>
          )}
          {ocidUsername && (
            <div className="max-w-4xl w-full">
              {!isConnected && (
                <Card className="w-full max-w-2xl p-8 shadow-lg" style={{margin: 'auto'}}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {courses.map((course) => (
                      <div key={course.id} className="border p-4 rounded shadow-md">
                        <h3 className="text-xl font-bold">{course.title}</h3>
                        <p className="mt-2">{course.description}</p>
                        <p className="mt-2">Price: {course.price} EDU</p>
                        {!ownedCourses.includes(course.id) && (
                          <div className="">
                          <Button 
                            className="mt-4 mr-2"
                            onClick={() => purchaseCourse(course.id, course.price)}
                          >
                            Purchase
                          </Button>
                          <Button
                            className="mt-4"
                            onClick={() => giftCourse(course.id, course.price)}
                          >
                            Gift
                          </Button>
                          </div>
                        )}
                        {ownedCourses.includes(course.id) && (
                          <span className="block mt-4 text-green-500">Owned</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold mb-4">My Courses</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {ownedCourses.map((course) => (
                      <div key={course.id} className="border p-4 rounded shadow-md">
                        <h3 className="text-xl font-bold">{course.title}</h3>
                        <p className="mt-2">{course.description}</p>
                        <p className="mt-2">Price: {course.price} EDU</p>
                  <Button className="mt-4" onClick={() => window.location.href = `/my-courses`}>Open</Button>
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
    </>
  );
};

export default App;


