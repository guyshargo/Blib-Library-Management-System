package oak.logic;

import java.time.LocalDate;
import java.util.*;

import oak.enums.FreezeStatus;
import oak.model.BorrowedBook;
import oak.model.Member;
import oak.model.OrderedBook;

/**
 * Description:
 * Class for implementing the time scheduling in the system
 */
public class TimeManagement {
    /**
     * Attribute timer for scheduling
     */
    private Timer timer = new Timer();

    /**
     * Description:
     * Method for initializing the reminder in the system
     */
    public void startReminderScheduler() {
        // Calculate the time for the next 8 AM
        Calendar next8AM = Calendar.getInstance();
        next8AM.set(Calendar.HOUR_OF_DAY, 8);
        next8AM.set(Calendar.MINUTE, 0);
        next8AM.set(Calendar.SECOND, 0);
        next8AM.set(Calendar.MILLISECOND, 0);

        if (next8AM.getTimeInMillis() <= System.currentTimeMillis()) {
            next8AM.add(Calendar.DAY_OF_MONTH, 1);
        }
        long delay8AM = next8AM.getTimeInMillis() - System.currentTimeMillis();
        long period8AM = 24 * 60 * 60 * 1000; // 24 hours

        // Schedule the 8 AM task
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {

                // Logic for 8 AM tasks
                ReturnBookReminder();
                CancelOrderAfterTwoDays();
                CheckFreezeStatusDate();
            }
        }, delay8AM, period8AM);

        // Calculate the time for the next 12 AM
        Calendar next12AM = Calendar.getInstance();
        next12AM.set(Calendar.HOUR_OF_DAY, 0);
        next12AM.set(Calendar.MINUTE, 0);
        next12AM.set(Calendar.SECOND, 0);
        next12AM.set(Calendar.MILLISECOND, 0);

        if (next12AM.getTimeInMillis() <= System.currentTimeMillis()) {
            next12AM.add(Calendar.DAY_OF_MONTH, 1);
        }
        long delay12AM = next12AM.getTimeInMillis() - System.currentTimeMillis();
        long period12AM = 24 * 60 * 60 * 1000; // 24 hours

        // Schedule the 12 AM task
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                // Logic for 12 AM tasks
                CheckReportDate();
                addBorrowTrackingAndStatusTracking();
            }
        }, delay12AM, period12AM);
    }

    /**
     * Description:
     * Method for initializing the book reminder in the system
     */
    private void ReturnBookReminder() {
        LocalDate today = LocalDate.now();
        BorrowLogic borrowLogic = new BorrowLogic();
        //get a list of all borrowed books in the database
        List<BorrowedBook> borrowedBookList = borrowLogic.importAllBorrowedBooks();
        for (BorrowedBook book : borrowedBookList) {
            if (book.getReturnDate().minusDays(1).equals(today)) {
                // Perform the email sending logic
                Notification.sendReturnBookReminderByEmail(book, book.getReturnDate());
            }
        }
    }
    /**
     * Description:
     * Method for initializing the book reminder in the system
     */
    private void CancelOrderAfterTwoDays() {
        OrderLogic orderLogic = new OrderLogic();
        //get a list of all borrowed books in the database
        List<OrderedBook> orderedBooks = orderLogic.importAllLateOrderedBooks(LocalDate.now());
        for (OrderedBook book : orderedBooks) {
            orderLogic.cancelOrder(book.getOrderId());
            Notification.sendCanceledBookOrderNotificationByEmail(book,LocalDate.now());
        }
    }


    /**
     * Description:
     * Method for generating a report at the end of each month
     *
     * */
    private void CheckReportDate()  {
        LocalDate today = LocalDate.now();
        // Check if today is the last day of the month
        if (today.getDayOfMonth() == 1) {
            ReportLogic.CreateReport();
        }
    }

    /**
     * Description:
     * Method for un-freezing all members in the member_db
     */
    private void CheckFreezeStatusDate() {
        MemberLogic memberLogic = new MemberLogic();
        List<Member> memberUnFreezeList = memberLogic.fetchFrozenMembersOlderThanAMonth();
        for (Member member : memberUnFreezeList) {
            memberLogic.setFreezeStatus(member.getMemberId(), FreezeStatus.NOT_FROZEN.getDbValue(), LocalDate.now());
        }
    }
    /**
     * Description:
     * Method for adding all the current memeber freeze status count and borrow tracking to todays tracking
     */
    private void addBorrowTrackingAndStatusTracking(){
        LocalDate today = LocalDate.now();
        if(today.getDayOfMonth() != 1){
            ReportLogic.addAllStatusTracking();
            ReportLogic.addAllBorrowTracking();
        }
    }

    /**
     * Description:
     * Method for stopping the timer attribute
     */
    public void stopScheduler() {
        timer.cancel();
    }
}