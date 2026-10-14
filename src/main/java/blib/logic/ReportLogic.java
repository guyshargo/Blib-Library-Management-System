package blib.logic;

import blib.model.BorrowHistory;
import blib.model.BorrowTracking;
import blib.model.BorrowedBook;
import blib.model.MemberStatusChange;
import blib.model.Report;
import blib.model.StatusTracking;
import blib.model.Member;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import blib.database.MysqlConnection;
import blib.enums.FreezeStatus;
import blib.enums.ReportType;


public class ReportLogic {

    private final MysqlConnection dbConnector;


    public ReportLogic() { dbConnector = MysqlConnection.getInstance(); }

    
    public synchronized void saveMemberStatusChange(MemberStatusChange memberStatusChange) {
        String insertQuery = "INSERT INTO member_status_changes (member_id, member_name, status, change_date) VALUES (?, ?, ?, ?)";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(insertQuery)) {
             
            ps.setInt(1, memberStatusChange.getMemberId());
            ps.setString(2, memberStatusChange.getMemberName());
            ps.setString(3, memberStatusChange.getFreezeStatus().getDbValue());
            
            if (memberStatusChange.getChangeStatusDate() != null) {
                ps.setDate(4, Date.valueOf(memberStatusChange.getChangeStatusDate()));
            } else {
                ps.setNull(4, Types.DATE);
            }
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error saving status change: " + e.getMessage());
        }
    }

    private synchronized List<BorrowHistory> fetchBorrowHistory() throws SQLException {
        String query = "SELECT bh.*, b.title FROM borrow_histories bh JOIN book_copies bc ON bh.copy_id = bc.copy_id JOIN books b ON bc.book_id = b.book_id";
        List<BorrowHistory> borrowHistories = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                int memberId = rs.getInt("member_id");
                String bookName = rs.getString("title");
                String memberName = rs.getString("member_name");
                LocalDate borrowDate = rs.getDate("borrow_date").toLocalDate().plusDays(1);
                LocalDate originalReturnDate = rs.getDate("original_return_date").toLocalDate().plusDays(1);
                LocalDate actualReturnDate = rs.getDate("actual_return_date") != null ? rs.getDate("actual_return_date").toLocalDate().plusDays(1) : null;
                int lateDays = rs.getInt("late_days");
                int copyofBookId = rs.getInt("copy_id");
                
                BorrowHistory borrowHistory = new BorrowHistory(memberId, memberName, bookName, borrowDate, originalReturnDate, actualReturnDate, copyofBookId);
                borrowHistory.setLateDays(lateDays);
                borrowHistories.add(borrowHistory);
            }
        } catch (SQLException e) {
            System.err.println("Error fetching borrow history: " + e.getMessage());
        }
        return borrowHistories;
    }

    private synchronized List<MemberStatusChange> fetchMemberStatusChanges() throws SQLException {
        String query = "SELECT * FROM member_status_changes";
        List<MemberStatusChange> statusChanges = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                int memberId = rs.getInt("member_id");
                String memberName = rs.getString("member_name");
                FreezeStatus status = FreezeStatus.fromDbValue(rs.getString("status"));
                LocalDate changeStatusDate = rs.getDate("change_date") != null ? rs.getDate("change_date").toLocalDate().plusDays(1) : null;
                
                statusChanges.add(new MemberStatusChange(memberId, memberName, status, changeStatusDate));
            }
        } catch (SQLException e) {
            System.err.println("Error fetching member status changes: " + e.getMessage());
        }
        return statusChanges;
    }

    public synchronized void saveStatusTracking(StatusTracking statusTracking) {
        String insertQuery = "INSERT INTO status_tracking (tracking_date, frozen_members, not_frozen_members) VALUES (?, ?, ?)";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(insertQuery)) {
             
            ps.setDate(1, Date.valueOf(statusTracking.getDate()));
            ps.setInt(2, statusTracking.getFrozenMembers());
            ps.setInt(3, statusTracking.getNotFrozenMembers());
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error saving status tracking: " + e.getMessage());
        }
    }

    public synchronized void updateStatusTracking(StatusTracking statusTracking) {
        String updateQuery = "UPDATE status_tracking SET frozen_members = frozen_members + ?, not_frozen_members = not_frozen_members + ? WHERE tracking_date = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(updateQuery)) {
             
            ps.setInt(1, statusTracking.getFrozenMembers());
            ps.setInt(2, statusTracking.getNotFrozenMembers());
            ps.setDate(3, Date.valueOf(statusTracking.getDate()));
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error updating status tracking: " + e.getMessage());
        }
    }

    public synchronized List<StatusTracking> fetchAllStatusTrackingOrderedByDate() {
        String selectQuery = "SELECT tracking_date, frozen_members, not_frozen_members FROM status_tracking ORDER BY tracking_date ASC";
        List<StatusTracking> statusTrackingList = new ArrayList<>();
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(selectQuery);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                LocalDate date = rs.getDate("tracking_date").toLocalDate().plusDays(1);
                int frozenMembers = rs.getInt("frozen_members");
                int notFrozenMembers = rs.getInt("not_frozen_members");
                statusTrackingList.add(new StatusTracking(date, frozenMembers, notFrozenMembers));
            }
        } catch (SQLException e) {
            System.out.println("Error fetching status tracking: " + e.getMessage());
        }
        return statusTrackingList;
    }

    public synchronized void saveBorrowTracking(BorrowTracking borrowTracking) {
        String insertQuery = "INSERT INTO borrow_tracking (tracking_date, borrow_count, late_count) VALUES (?, ?, ?)";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(insertQuery)) {
             
            ps.setDate(1, Date.valueOf(borrowTracking.getDate()));
            ps.setInt(2, borrowTracking.getBorrowCount());
            ps.setInt(3, borrowTracking.getLateCount());
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error saving borrow tracking: " + e.getMessage());
        }
    }

    public synchronized List<BorrowTracking> fetchAllBorrowTrackingOrderedByDate() {
        String selectQuery = "SELECT tracking_date, borrow_count, late_count FROM borrow_tracking ORDER BY tracking_date ASC";
        List<BorrowTracking> borrowTrackingList = new ArrayList<>();
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(selectQuery);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                LocalDate date = rs.getDate("tracking_date").toLocalDate().plusDays(1);
                int borrowCount = rs.getInt("borrow_count");
                int lateCount = rs.getInt("late_count");
                borrowTrackingList.add(new BorrowTracking(date, borrowCount, lateCount));
            }
        } catch (SQLException e) {
            System.out.println("Error fetching borrow tracking: " + e.getMessage());
        }
        return borrowTrackingList;
    }

    public synchronized void updateBorrowTracking(BorrowTracking borrowTracking) {
        String updateQuery = "UPDATE borrow_tracking SET borrow_count = borrow_count + ?, late_count = late_count + ? WHERE borrow_count = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(updateQuery)) {
             
            ps.setInt(1, borrowTracking.getBorrowCount());
            ps.setInt(2, borrowTracking.getLateCount());
            ps.setDate(3, Date.valueOf(borrowTracking.getDate()));
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error updating borrow tracking: " + e.getMessage());
        }
    }

    public synchronized void saveBorrowHistory(BorrowHistory borrowHistory) {
        String insertQuery = "INSERT INTO borrow_histories (member_id, member_name, borrow_date, original_return_date, actual_return_date, late_days, copy_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(insertQuery)) {
             
            ps.setInt(1, borrowHistory.getMemberId());
            ps.setString(2, borrowHistory.getMemberName());
            ps.setDate(3, Date.valueOf(borrowHistory.getBorrowDate()));
            ps.setDate(4, Date.valueOf(borrowHistory.getOriginalReturnDate()));
            
            if (borrowHistory.getActualReturnDate() != null) {
                ps.setDate(5, Date.valueOf(borrowHistory.getActualReturnDate()));
            } else {
                ps.setNull(5, Types.DATE);
            }
            ps.setInt(6, borrowHistory.getLateDays());
            ps.setInt(7, borrowHistory.getBookCopyId());
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error saving borrow history: " + e.getMessage());
        }
    }

    public synchronized Report generateReport(LocalDate reportDate, ReportType reportType) {
        try {
            if (reportType == ReportType.BORROW_REPORT) {
                List<BorrowHistory> borrowHistoryList = fetchBorrowHistory();
                return new Report(reportDate, reportType, borrowHistoryList);
            } else if (reportType == ReportType.MEMBER_STATUS_REPORT) {
                List<MemberStatusChange> statusChanges = fetchMemberStatusChanges();
                return new Report(reportDate, reportType, statusChanges);
            } else if (reportType == ReportType.STATUS_TRACKING) {
                List<StatusTracking> statusTrackingList = fetchAllStatusTrackingOrderedByDate();
                return new Report(reportDate, reportType, statusTrackingList);
            } else {
                List<BorrowTracking> borrowTrackingList = fetchAllBorrowTrackingOrderedByDate();
                return new Report(reportDate, reportType, borrowTrackingList);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public synchronized void clearTableData(String tableName) {
        String query = "DELETE FROM " + tableName;
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.executeUpdate(); // FIXED: Removed parameter passing to executeUpdate()
            
        } catch (SQLException e) {
            System.err.println("Error deleting data from table: " + tableName + " - " + e.getMessage());
        }
    }

    public synchronized Report fetchReportByDate(ReportType reportType, LocalDate reportDate) {
        String query = "SELECT report_date, report_type, report_data FROM reports WHERE report_date = ? AND report_type = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setDate(1, java.sql.Date.valueOf(reportDate));
            ps.setString(2, reportType.name());
            
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    LocalDate retrievedReportDate = rs.getDate("report_date").toLocalDate();
                    ReportType retrievedReportType = ReportType.valueOf(rs.getString("report_type"));
                    String reportData = rs.getString("report_data");
                    return new Report(retrievedReportDate, retrievedReportType, reportData);
                }
            }
        } catch (SQLException e) {
            System.err.println("Error fetching report: " + e.getMessage());
        }
        return null;
    }

    public synchronized void saveReportToDatabase(Report report) {
        String query = "INSERT INTO reports (report_date, report_type, report_data) VALUES (?, ?, ?)";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query)) {
             
            ps.setDate(1, Date.valueOf(report.getDate()));
            ps.setString(2, report.getType().name());
            ps.setString(3, report.getData());
            ps.executeUpdate();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public synchronized List<Integer> getAvailableReportYears() throws SQLException {
        String query = "SELECT DISTINCT YEAR(report_date) AS reportYear FROM reports";
        List<Integer> years = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                years.add(rs.getInt("reportYear"));
            }
        } catch (SQLException e) {
            System.out.println("Error getting years with reports: " + e.getMessage());
        }
        return years;
    }

    public synchronized List<Integer> getAvailableReportMonths() throws SQLException {
        String query = "SELECT DISTINCT MONTH(report_date) AS reportMonth FROM reports";
        List<Integer> months = new ArrayList<>();
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(query);
             ResultSet rs = ps.executeQuery()) {
             
            while (rs.next()) {
                months.add(rs.getInt("reportMonth"));
            }
        } catch (SQLException e) {
            System.out.println("Error getting months with reports: " + e.getMessage());
        }
        return months;
    }

    public synchronized void updateActualReturnDate(int memberId, int copyOfBookId, LocalDate borrowDate, LocalDate actualReturnDate) {
        String updateQuery = "UPDATE borrow_histories SET actual_return_date = ? WHERE member_id = ? AND copy_id = ? AND borrow_date = ?";
        
        try (Connection conn = dbConnector.getConnection();
             PreparedStatement ps = conn.prepareStatement(updateQuery)) {
             
            ps.setDate(1, Date.valueOf(actualReturnDate));
            ps.setInt(2, memberId);
            ps.setInt(3, copyOfBookId);
            ps.setDate(4, Date.valueOf(borrowDate));
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error updating actual return date: " + e.getMessage());
        }
    }

    public synchronized void updateOriginalReturnDate(int memberId, int copyOfBookId, LocalDate borrowDate, LocalDate originalReturnDate) {
        String updateQuery = "UPDATE borrow_histories SET original_return_date = ? WHERE member_id = ? AND copy_id = ? AND borrow_date = ?";
        
        try (Connection connection = dbConnector.getConnection();
             PreparedStatement ps = connection.prepareStatement(updateQuery)) {
             
            ps.setDate(1, Date.valueOf(originalReturnDate));
            ps.setInt(2, memberId);
            ps.setInt(3, copyOfBookId);
            ps.setDate(4, Date.valueOf(borrowDate));
            ps.executeUpdate();
            
        } catch (SQLException e) {
            System.out.println("Error updating original return date: " + e.getMessage());
        }
    }

    public synchronized static void CreateReport() {
        LocalDate today = LocalDate.now().minusDays(1);
        ReportLogic reportLogic = new ReportLogic();
        
        Report memberStatus = reportLogic.generateReport(today, ReportType.MEMBER_STATUS_REPORT);
        Report borrowHistory = reportLogic.generateReport(today, ReportType.BORROW_REPORT);
        Report statusTracking = reportLogic.generateReport(today, ReportType.STATUS_TRACKING);
        Report borrowTracking = reportLogic.generateReport(today, ReportType.BORROW_TRACKING);

        reportLogic.saveReportToDatabase(memberStatus);
        reportLogic.saveReportToDatabase(borrowHistory);
        reportLogic.saveReportToDatabase(statusTracking);
        reportLogic.saveReportToDatabase(borrowTracking);

        reportLogic.clearTableData("member_status_changes");
        reportLogic.clearTableData("borrow_histories");
        reportLogic.clearTableData("status_tracking");
        reportLogic.clearTableData("borrow_tracking");

        addAllmembersStatus();
        addAllBorrowedBooks();
        addAllStatusTracking();
        addAllBorrowTracking();
    }

    private synchronized static void addAllmembersStatus() {
        ReportLogic reportLogic = new ReportLogic();
        MemberLogic memberLogic = new MemberLogic();
        List<Member> memberList = memberLogic.fetchAllMembers();
        for (Member member : memberList) {
            reportLogic.saveMemberStatusChange(new MemberStatusChange(
                member.getMemberId(),
                member.getFullName(),
                member.getFreezeStatus(),
                member.getFreezeStatusDate()
            ));
        }
    }

    public synchronized static void addAllStatusTracking() {
        ReportLogic reportLogic = new ReportLogic();
        MemberLogic memberLogic = new MemberLogic();
        int frozen = 0;
        int notFrozen = 0;
        for (Member member : memberLogic.fetchAllMembers()) {
            if (member.getFreezeStatus() == FreezeStatus.FROZEN)
                frozen++;
            else
                notFrozen++;
        }
        reportLogic.saveStatusTracking(new StatusTracking(LocalDate.now(), frozen, notFrozen));
    }

    private synchronized static void addAllBorrowedBooks() {
        ReportLogic reportLogic = new ReportLogic();
        BorrowLogic borrowLogic = new BorrowLogic();
        MemberLogic memberLogic = new MemberLogic();
        List<BorrowedBook> borrowedBooks = borrowLogic.importAllBorrowedBooks();
        for (BorrowedBook borrowedBook : borrowedBooks) {
            Member member = memberLogic.fetchMemberById(borrowedBook.getMemberId());
            reportLogic.saveBorrowHistory(new BorrowHistory(borrowedBook.getMemberId(), member.getFullName(), borrowedBook.getNameOfBook(), borrowedBook.getBorrowDate(), borrowedBook.getReturnDate(), borrowedBook.getCopyOfBookId()));
        }
    }

    public synchronized static void addAllBorrowTracking() {
        ReportLogic reportLogic = new ReportLogic();
        BorrowLogic borrowLogic = new BorrowLogic();
        List<BorrowedBook> borrowedBooks = borrowLogic.importAllBorrowedBooks();
        int lates = 0;
        int borrows = 0;
        for (BorrowedBook borrowedBook : borrowedBooks) {
            if (borrowedBook.getReturnDate().isBefore(LocalDate.now())) {
                lates++;
            }
            borrows++;
        }
        reportLogic.saveBorrowTracking(new BorrowTracking(LocalDate.now(), borrows, lates));
    }
}