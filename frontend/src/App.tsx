import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Layout from './components/Layout';

import Login from './pages/auth/Login';

import LibraryExplorer from './pages/catalog/LibraryExplorer';
import BookDetails from './pages/catalog/BookDetails';
import Genres from './pages/catalog/Genres';
import Trending from './pages/catalog/Trending';

import Home from './pages/catalog/Home';
import PersonalInfo from './pages/member/PersonalInfo';
import MyBooks from './pages/member/MyBooks';

import ReturnBook from './pages/librarian/ReturnBook';
import ViewMember from './pages/librarian/ViewMember';
import Reports from './pages/librarian/Reports';
import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import RegisterMember from './pages/librarian/RegisterMember';
import ManageMember from './pages/librarian/ManageMember';
import BorrowBook from './pages/librarian/BorrowBook';
import Invoice from './pages/librarian/Invoice';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Standalone Gateway Windows */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/member" element={<Navigate to="/login" replace />} />
        <Route path="/login/librarian" element={<Navigate to="/login" replace />} />

        {/* Core System Pages - Wrapped in Main Layout */}
        <Route element={<Layout />}>
            <Route path="/catalog" element={<LibraryExplorer />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/book-details" element={<BookDetails />} />

            <Route path="/home" element={<Home />} />
            <Route path="/personal-info" element={<PersonalInfo />} />
            <Route path="/orders" element={<Navigate to="/catalog" replace />} />
            <Route path="/my-books" element={<MyBooks />} />
            <Route path="/my-borrows" element={<Navigate to="/my-books" replace />} />

            <Route path="/return-book" element={<ReturnBook />} />
            <Route path="/view-member" element={<ViewMember />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/librarian-dashboard" element={<LibrarianDashboard />} />
            <Route path="/register-member" element={<RegisterMember />} />
            <Route path="/manage-members" element={<ManageMember />} />
            <Route path="/borrow-book" element={<BorrowBook />} />
            <Route path="/invoices" element={<Invoice />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;