import React from "react";
import { Facebook, Youtube, Twitter } from "lucide-react";

export function GovernmentFooter() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <footer className="w-full shrink-0 flex flex-col font-sans relative mt-auto border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900">
      <div className="w-full py-5 px-6 md:px-10 flex flex-col lg:flex-row justify-between items-center text-[12px] text-slate-600 dark:text-slate-400 gap-6">
        
        <div className="flex flex-col gap-2 w-full lg:w-auto text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1">
            <a href="#" className="hover:underline pr-2 border-r border-slate-300 dark:border-slate-700 leading-none">Terms of Use</a>
            <a href="#" className="hover:underline px-2 border-r border-slate-300 dark:border-slate-700 leading-none">Privacy Policy</a>
            <a href="#" className="hover:underline px-2 border-r border-slate-300 dark:border-slate-700 leading-none">Help</a>
            <a href="#" className="hover:underline pl-2 leading-none">Contact Us</a>
          </div>
          <p className="mt-1">Copyright © {new Date().getFullYear()} Material Harmonization Platform. All rights reserved.</p>
        </div>

        <div className="flex items-center gap-6 lg:gap-8 shrink-0 flex-wrap justify-center">
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors"><Facebook size={18} fill="currentColor" strokeWidth={0} /></a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors"><Youtube size={20} strokeWidth={2.5} /></a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors"><Twitter size={18} fill="currentColor" strokeWidth={0} /></a>
          </div>
          <div className="text-right text-[11px] flex flex-col gap-0.5">
            <p>Platform Version: 1.0.0</p>
            <p>Last Updated : {lastUpdated}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
