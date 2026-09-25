import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import AboutSection from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import EditPdf from "./pages/EditPdf.jsx";
import CompressPdf from "./pages/CompressPdf.jsx";
import SplitPdf from "./pages/SplitPdf.jsx";
import JpgToPdf from "./pages/JpgToPdf.jsx";
import CombinePdf from "./pages/CombinePdf.jsx";
import PdfToWord from "./pages/PdfToWord.jsx";
import PdfToExcel from "./pages/PdfToExcel.jsx";
import ExcelToPdf from "./pages/ExcelToPdf.jsx";
import ProtectUnlockPdf from "./pages/ProtectUnlockPdf.jsx";
import OrganizeCropPdf from "./pages/OrganizeCropPdf.jsx";
import WordToPdf from "./pages/WordToPdf.jsx";
import PdfToImage from "./pages/PdfToImage.jsx";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-base-950">
      <Navbar />
      <main className="flex-1 bg-grid-fade">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutSection />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/edit-pdf" element={<EditPdf />} />
          <Route path="/compress-pdf" element={<CompressPdf />} />
          <Route path="/split-pdf" element={<SplitPdf />} />
          <Route path="/jpg-to-pdf" element={<JpgToPdf />} />
          <Route path="/pdf-to-image" element={<PdfToImage />} />
          <Route path="/combine-pdf" element={<CombinePdf />} />
          <Route path="/pdf-to-word" element={<PdfToWord />} />
          <Route path="/pdf-to-excel" element={<PdfToExcel />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
          <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
          <Route path="/protect-unlock-pdf" element={<ProtectUnlockPdf />} />
          <Route path="/organize-crop-pdf" element={<OrganizeCropPdf />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
