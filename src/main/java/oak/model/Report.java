package oak.model;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import oak.enums.FreezeStatus;
import oak.enums.ReportType;


public class Report implements Serializable {
    private static final long serialVersionUID = 1L;
    private LocalDate date;
    private ReportType type;
    private String data;  // Store report data as a CSV string


    public Report(LocalDate date, ReportType type, List<?> data) {
        this.date = date;
        this.type = type;

        // Check if it's a list of MemberStatusChange objects or BorrowHistory objects
        if (data != null && !data.isEmpty()) {
            if (data.get(0) instanceof MemberStatusChange) {
                this.data = convertToCSVMemberStatus(castReportData(data, MemberStatusChange.class));
            } else if (data.get(0) instanceof BorrowHistory) {
                this.data = convertToCSVBorrow(castReportData(data, BorrowHistory.class));
            } else if (data.get(0) instanceof StatusTracking) {
                this.data = convertToCSVStatusTracking(castReportData(data, StatusTracking.class));
            } else if (data.get(0) instanceof BorrowTracking) {
                this.data = convertToCSVBorrowTracking(castReportData(data, BorrowTracking.class));
            } else {
                throw new IllegalArgumentException("Unsupported data type in report data");
            }
        }
    }

    private static <T> List<T> castReportData(List<?> data, Class<T> dataType) {
        List<T> typedReportData = new ArrayList<>(data.size());
        for (Object item : data) {
            typedReportData.add(dataType.cast(item));
        }
        return typedReportData;
    }


    public Report(LocalDate date, ReportType type, String data) {
        this.date = date;
        this.type = type;
        this.data = data;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public ReportType getType() { return type; }
    public void setType(ReportType type) { this.type = type; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }


    private String convertToCSVStatusTracking(List<StatusTracking> statusTrackings) {
        StringBuilder sb = new StringBuilder();
        // CSV header
        sb.append("Date,FrozenMembers,NotFrozenMembers\n");
        // Loop through the status tracking list and format them into CSV rows
        for (StatusTracking tracking : statusTrackings) {
            sb.append(tracking.getDate())  // Date
                    .append(", ")
                    .append(tracking.getFrozenMembers())  // FrozenMembers
                    .append(", ")
                    .append(tracking.getNotFrozenMembers())  // NotFrozenMembers
                    .append("\n");
        }
        return sb.toString();
    }


    public List<StatusTracking> parseStatusTrackingCSV(String csvData) {
        List<StatusTracking> statusTrackings = new ArrayList<>();
        String[] lines = csvData.split("\n");
        // Skip the header
        for (int i = 1; i < lines.length; i++) {
            String[] values = lines[i].split(", ");
            if (values.length == 3) {
                // Parse the date
                LocalDate date = LocalDate.parse(values[0].trim());
                // Parse frozen members count
                int frozenMembers = Integer.parseInt(values[1].trim());
                // Parse not frozen members count
                int notFrozenMembers = Integer.parseInt(values[2].trim());
                // Create and add a StatusTracking object to the list
                statusTrackings.add(new StatusTracking(date, frozenMembers, notFrozenMembers));
            }
        }
        return statusTrackings;
    }


    private static String convertToCSVBorrowTracking(List<BorrowTracking> borrowTrackings) {
        StringBuilder sb = new StringBuilder();
        // CSV header
        sb.append("Date,BorrowCount,LateCount\n");
        // Loop through the borrow tracking list and format them into CSV rows
        for (BorrowTracking tracking : borrowTrackings) {
            sb.append(tracking.getDate())  // Date
                    .append(", ")
                    .append(tracking.getBorrowCount())  // BorrowCount
                    .append(", ")
                    .append(tracking.getLateCount())  // LateCount
                    .append("\n");
        }
        return sb.toString();
    }


    public static List<BorrowTracking> parseCSVBorrowTracking(String csvData) {
        List<BorrowTracking> borrowTrackings = new ArrayList<>();
        String[] lines = csvData.split("\n");
        // Skip the header
        for (int i = 1; i < lines.length; i++) {
            String[] values = lines[i].split(", ");
            if (values.length == 3) {
                // Parse the date
                LocalDate date = LocalDate.parse(values[0].trim());

                // Parse borrow count
                int borrowCount = Integer.parseInt(values[1].trim());

                // Parse late count
                int lateCount = Integer.parseInt(values[2].trim());

                // Create and add a BorrowTracking object to the list
                borrowTrackings.add(new BorrowTracking(date, borrowCount, lateCount));
            }
        }
        return borrowTrackings;
    }



    private String convertToCSVMemberStatus(List<MemberStatusChange> statusChanges) {
        StringBuilder sb = new StringBuilder();
        // CSV header
        sb.append("MemberID,memberName,MemberStatus,ChangeStatusDate\n");
        // Loop through status changes and format them into CSV rows
        for (MemberStatusChange change : statusChanges) {
            sb.append(change.getMemberId())  // MemberID
                    .append(", ")
                    .append(change.getMemberName())  // MemberName
                    .append(", ")
                    .append(change.getFreezeStatus().getDbValue())  // MemberStatus (Frozen/NotFrozen)
                    .append(", ")
                    .append(change.getChangeStatusDate().plusDays(1))  // ChangeStatusDate
                    .append("\n");
        }
        return sb.toString();
    }

    private String convertToCSVBorrow(List<BorrowHistory> borrowHistoryList) {
        StringBuilder sb = new StringBuilder();
        // CSV header
        sb.append("MemberID,memberName,BookName,BorrowDate,OriginalReturnDate,ActualReturnDate,LateDays,CopyOfBookId\n");
        // Loop through borrow history and format them into CSV rows
        for (BorrowHistory borrow : borrowHistoryList) {
            sb.append(borrow.getMemberId())
                    .append(", ")
                    .append(borrow.getMemberName())
                    .append(", ")
                    .append(borrow.getBookTitle())
                    .append(", ")
                    .append(borrow.getBorrowDate())
                    .append(", ")
                    .append(borrow.getOriginalReturnDate())
                    .append(", ")
                    .append(borrow.getActualReturnDate())
                    .append(", ")
                    .append(borrow.getLateDays())
                    .append(", ")
                    .append(borrow.getBookCopyId())
                    .append("\n");
        }
        return sb.toString();
    }


    public List<MemberStatusChange> parseMemberStatusCSV(String csvData) {
        List<MemberStatusChange> memberStatusChanges = new ArrayList<>();
        String[] lines = csvData.split("\n");
        // Skip the header
        for (int i = 1; i < lines.length; i++) {
            String[] values = lines[i].split(", ");

            if (values.length == 4) {
                int memberId = Integer.parseInt(values[0].trim());
                String memberName = values[1].trim();
                FreezeStatus memberStatus = FreezeStatus.fromDbValue(values[2].trim());
                LocalDate changeStatusDate = (values[3] == null || values[3].equals("null") || values[3].isEmpty())
                        ? null : LocalDate.parse(values[3].trim());

                memberStatusChanges.add(new MemberStatusChange(memberId, memberName, memberStatus, changeStatusDate));
            }
        }
        return memberStatusChanges;
    }


    public List<BorrowHistory> parseBorrowHistoryCSV(String csvData) {
        List<BorrowHistory> borrowHistoryList = new ArrayList<>();
        String[] lines = csvData.split("\n");
        // Skip the header
        for (int i = 1; i < lines.length; i++) {
            String[] values = lines[i].split(", ");
            int memberId = Integer.parseInt(values[0].trim());
            String memberName = values[1].trim();
            String bookName = values[2].trim();
            LocalDate borrowDate = LocalDate.parse(values[3].trim());
            LocalDate originalReturnDate = LocalDate.parse(values[4].trim());
            // Parse the actual return date (handle null or empty values)
            LocalDate actualReturnDate = (values[5] == null || values[5].equals("null") || values[5].isEmpty())
                    ? null : LocalDate.parse(values[5].trim());

            int lateDays = Integer.parseInt(values[6].trim());
            int copyofBookId = Integer.parseInt(values[7].trim());

            // Create BorrowHistory object and add it to the list
            BorrowHistory borrowHistory = new BorrowHistory(memberId, memberName, bookName, borrowDate, originalReturnDate, actualReturnDate, copyofBookId);
            lateDays = lateDays == 0 && actualReturnDate == null ? borrowHistory.calculateLateDays(originalReturnDate, date) : borrowHistory.calculateLateDays(originalReturnDate, actualReturnDate);
            borrowHistory.setLateDays(lateDays);  // Set late days, if calculated externally
            borrowHistoryList.add(borrowHistory);
        }
        return borrowHistoryList;
    }


    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Report Date: ").append(date).append("\n")
                .append("Report Type: ").append(type).append("\n")
                .append("Report Data:\n");
        // Split data (CSV) into rows and display it as a table
        String[] rows = data.split("\n");
        for (String row : rows) {
            sb.append("| ").append(row.replace(",", " | ")).append(" |\n");
        }
        return sb.toString();
    }
}