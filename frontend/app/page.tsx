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
  const [mmStatus, setMmStatus] = useState<string>("Not connected!");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accountAddress, setAccountAddress] = useState<string | undefined>(
    undefined
  );
  const [displayMessage, setDisplayMessage] = useState<string>("");
  const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
  const [getNetwork, setGetNetwork] = useState<number | undefined>(undefined);
  const [contracts, setContracts] = useState<Contracts | undefined>(undefined);
  const [contractAddress, setContractAddress] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [ocidUsername, setOcidUsername] = useState<string | null>(null);

  const CourseStorageContractAddress = "0x6CF3459F225385ae69d9b09786Ffe3b404725111";
  const [courses, setCourses] = useState<Course[]>([]);
  const [ownedCourses, setOwnedCourses] = useState<Course[]>([]);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", content: "", price: "" });

  useEffect(() => {
    // Check if user is logged in with OCID
    if (authState.idToken) {
      const decodedToken = jwtDecode<DecodedToken>(authState.idToken);
      setOcidUsername(decodedToken.edu_username);
    }

    // Initialize Web3 and set contract
    (async () => {
      try {
        if (typeof window.ethereum !== "undefined") {
          const web3 = new Web3(window.ethereum);
          setWeb3(web3);
          const networkId: any = await web3.eth.getChainId();
          setGetNetwork(networkId);
          // const contractAddress = "0x48D2d71e26931a68A496F66d83Ca2f209eA9956E";
          const contractAddress = CourseStorageContractAddress;
          setContractAddress(CourseStorageContractAddress);
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
    // Connect to MetaMask and handle errors
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
        setMmStatus("Connected!");
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect to wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };


  const getAllCourses = async () => {
    if (contracts) {
      try {
        const courses = await contracts.methods.getOwnedCourses(accountAddress).call();
        console.log(courses);
      } catch (error) {
        console.error("Failed to read from contract:", error);
      }
    }
  }

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
        const ownedCourseIds = await contracts.methods.getOwnedCourses(accountAddress).call();
        console.log("Owned course IDs:", ownedCourseIds);
  
        const fetchedCourses: Course[] = [];
        for (let i = 0; i < ownedCourseIds.length; i++) {
          const courseId = ownedCourseIds[i];
          const course = await contracts.methods.getCourse(courseId).call();
          fetchedCourses.push({
            id: courseId,
            title: course.title,
            description: course.description,
            price: Web3.utils.fromWei(course.price, 'ether')
          });
        }
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
          value: priceWei
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


  return (
    <>
    <div className="App min-h-screen flex flex-col items-center justify-between">
      <Header />
      <div className="flex flex-col items-center justify-center flex-grow w-full mt-24 px-4">
        <Card className="w-full max-w-2xl p-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-4xl font-bold mt-4">
              📚 Course Management 📚
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center mt-4 space-y-6">
            {!ocidUsername && <LoginButton />}
            {ocidUsername && (
              <div className="text-center text-xl">
                <h1>
                  👉Welcome,{" "}
                  <a href="/user">
                    <strong>{ocidUsername}👈</strong>
                  </a>{" "}
                </h1>
              </div>
            )}
            {!isConnected && (
              <Button
                className="bg-teal-400 hover:bg-teal-700 text-black font-bold py-2 px-4 rounded-md mb-4"
                onClick={ConnectWallet}
                variant="link"
              >
                Connect with MetaMask
              </Button>
            )}
            {isConnected && (
              <>
                <div className="text-center text-xl">
                  <h1>
                    Connected to wallet address: <strong>{accountAddress}</strong>
                  </h1>
                </div>
                <div className="w-full space-y-4">
                  <h2 className="text-2xl font-bold">Create New Course</h2>
                  <input
                    type="text"
                    placeholder="Course Title"
                    className="w-full p-2 border rounded"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Course Description"
                    className="w-full p-2 border rounded"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  />
                  <textarea
                    placeholder="Course Content (Markdown)"
                    className="w-full p-2 border rounded"
                    value={newCourse.content}
                    onChange={(e) => setNewCourse({...newCourse, content: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Price (ETH)"
                    className="w-full p-2 border rounded"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                  />
                  <Button onClick={createCourse}>Create Course</Button>
                </div>
                <div className="w-full space-y-4">
                  <h2 className="text-2xl font-bold">Available Courses</h2>
                  {courses.map((course) => (
                    <div key={course.id} className="border p-4 rounded">
                      <h3 className="text-xl font-bold">{course.title}</h3>
                      <p>{course.description}</p>
                      <p>Price: {course.price} ETH</p>
                      {!ownedCourses.includes(course.id) && (
                        <Button onClick={() => purchaseCourse(course.id, course.price)}>
                          Purchase
                        </Button>
                      )}
                      {ownedCourses.includes(course.id) && (
                        <span className="text-green-500">Owned</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="w-full space-y-4">
                  <h2 className="text-2xl font-bold">My Courses</h2>
                  {
                    ownedCourses.map((course) => (
                      <div key={course.id} className="border p-4 rounded">
                        <h3 className="text-xl font-bold">{course.title}</h3>
                        <p>{course.description}</p>
                        <p>Price: {course.price} ETH</p>
                        <p>Course Content: {course.markdownContent}</p>
                      </div>
                    ))
                  }
                </div>
              </>
            )}
            {showMessage && (
              <>
                <p className="text-center text-sm mt-6">{loading ? "Loading..." : displayMessage}</p>
                <p className="mt-4 text-xs ">
                  Txn hash:{" "}
                  
                    {/* className="text-teal-300"
                    href={
                      "https://opencampus-codex.blockscout.com/tx/" + txnHash
                    }
                    target="_blank"
                    rel="noopener noreferrer" */}
                  
                    {txnHash}
                  {/* </a> */}
                </p>
                {loading && (
                  <p className="mt-2 text-xs">
                    Please wait till the Txn is completed :)
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
    </>
  );
};

export default App;


