"use client";

import Link from 'next/link';
import Auth from './auth';
import { useEffect } from 'react';

export default function Home() {

 
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="grid grid-cols-2 gap-8">
         
         
          
          <Link href="/ngram" passHref>
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/placeholder-ngram.jpg"
                alt="N-gram"
                className="w-32 h-32"
              />
              <p>N-gram</p>
            </div>
          </Link>

          <Link href="/topic" passHref>
            <div className="flex flex-col items-center cursor-pointer">
              <img
                src="/placeholder-topic.jpg"
                alt="Topic Modeling"
                className="w-32 h-32"
              />
              <p>Topic Modeling</p>
            </div>
          </Link>

       
        </div>
      </main>
      
    </div>
  );
}
