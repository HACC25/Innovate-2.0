import Layout from "./Layout.jsx";

import ApplicationDetail from "./ApplicationDetail";

import JobManagement from "./JobManagement";

import Analytics from "./Analytics";

import BulkUpload from "./BulkUpload";

import Home from "./Home";

import Applications from "./Applications";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    ApplicationDetail: ApplicationDetail,
    
    JobManagement: JobManagement,
    
    Analytics: Analytics,
    
    BulkUpload: BulkUpload,
    
    Home: Home,
    
    Applications: Applications,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<ApplicationDetail />} />
                
                
                <Route path="/ApplicationDetail" element={<ApplicationDetail />} />
                
                <Route path="/JobManagement" element={<JobManagement />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/BulkUpload" element={<BulkUpload />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Applications" element={<Applications />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}