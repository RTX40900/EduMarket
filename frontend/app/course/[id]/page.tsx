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


const CoursePage = ({ params }) => {
    const { id } = params;
    const { authState } = useOCAuth();
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [accountAddress, setAccountAddress] = useState<string | undefined>(
        undefined
    );
    const [displayMessage, setDisplayMessage] = useState<string>("");
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


    const fetchCourse = async (id) => {
        console.log(`type of id: ${typeof id}`)
        let idinteger = parseInt(id);
        if (contracts && accountAddress) {
            try {
                const fetchedCourses: Course[] = [];
                const course = await contracts.methods.getCourse(idinteger).call();
                console.log(`Course: ${course.title}`)
                fetchedCourses.push({
                    id: idinteger,
                    title: course.title,
                    description: course.description,
                    price: Web3.utils.fromWei(course.price, 'ether'),
                    markdownContent: course.markdownContent
                });
                setOwnedCourses(fetchedCourses);
                console.log(`Owned courses: ${ownedCourses}`)
            } catch (error) {
                console.error("Failed to fetch owned courses:", error);
            }
        }
    };

    useEffect(() => {

        if (isConnected) {
            fetchCourse(id);
            console.log(`Owned courses: ${ownedCourses}`)
        }
    }, [isConnected]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-12 mt-16">
                {!ocidUsername && <LoginButton />}
                {ocidUsername && (
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center text-xl mb-8">
                            <h1>
                                Welcome,{" "}
                                <a href="/user">
                                    <strong>{ocidUsername}👋🏼</strong>
                                </a>{" "}
                            </h1>
                        </div>
                        {!isConnected && (
                            <Card className="max-w-md mx-auto p-8 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-center mb-4">
                                        EduMarket
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
                            <div className="space-y-8">
                                {ownedCourses.map((course) => (
                                    <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                                        <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
                                        <p className="text-gray-600 mb-6">{course.description}</p>
                                        <div className="prose max-w-none">
                                            {course.markdownContent && (
                                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                                    {course.markdownContent.replace(
                                                        /https:\/\/youtu\.be\/(\w+)/g,
                                                        '<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameBorder="0" allowFullScreen></iframe>'
                                                    )}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default CoursePage;
