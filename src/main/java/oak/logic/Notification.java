package oak.logic;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import oak.model.BorrowedBook;
import oak.model.Member;
import oak.model.OrderedBook;

import java.time.format.DateTimeFormatter;
import java.util.Properties;
import java.time.LocalDate;

/**
 * Description:
 * Class for the notifications in the system
 */
public class Notification {
    /**
     * Attribute for the DateTimeFormatter as dd/MM/yyyy format
     */
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    /**
     * Description:
     * Method for sending a 'must return book' reminder by email to the member
     *
     * @param book       BorrowedBook.class
     * @param returnDate LocalDate.class
     */
    public static void sendReturnBookReminderByEmail(BorrowedBook book, LocalDate returnDate) {
        //get member's information
        MemberLogic memberLogic = new MemberLogic();
        Member sendToSub = memberLogic.fetchMemberById(book.getMemberId());
        //set the receiver email address
        String to = sendToSub.getEmail();
        // Construct the email content
        String formattedReturnDate = returnDate.format(formatter);
        String emailContent = String.format(
                "<p>Dear %s,</p>" +
                        "<p>This is a friendly reminder to return the book: <strong>%s</strong> by the date: <strong>%s</strong>.</p>" +
                        "<p>Thank you for your cooperation!</p>" +
                        "<p>Best regards,<br/>Blib Library</p>",
                sendToSub.getFullName(), book.getNameOfBook(), formattedReturnDate);
        SendEmail(emailContent, to);
    }

    /**
     * Description:
     * Method for sending an 'arrived book' reminder by email to the member
     *
     * @param book                  BorrowedBook.class
     * @param reservationExpiryDate LocalDate.class
     */
    public static void sendArrivedBookOrderReminderByEmail(OrderedBook book, LocalDate reservationExpiryDate) {
        // Get Member's information
        MemberLogic memberLogic = new MemberLogic();
        Member sendToSub = memberLogic.fetchMemberById(book.getMemberId());
        // Set the receiver's email address
        String to = sendToSub.getEmail();
        // Construct the email content
        String formattedExpiryDate = reservationExpiryDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String emailContent = String.format(
                "<p>Dear %s,</p>" +
                        "<p>We are pleased to inform you that the book you ordered, <strong>%s</strong>, is now available at the library.</p>" +
                        "<p>The book will be reserved for you until <strong>%s</strong>. Please make sure to visit the library and borrow it by this date to secure your reservation.</p>" +
                        "<p>If you have any questions, feel free to contact us.</p>" +
                        "<p>Best regards,<br/>Blib Library</p>",
                sendToSub.getFullName(), book.getBookTitle(), formattedExpiryDate);
        // Send the email
        SendEmail(emailContent, to);
    }
    /**
     * Description:
     * Method for sending an email for book order cancellation after two days
     *
     * @param book                  OrderedBook.class
     * @param cancellationDate      LocalDate.class
     */
    public static void sendCanceledBookOrderNotificationByEmail(OrderedBook book, LocalDate cancellationDate) {
        // Get Member's information
        MemberLogic memberLogic = new MemberLogic();
        Member sendToSub = memberLogic.fetchMemberById(book.getMemberId());
        // Set the receiver's email address
        String to = sendToSub.getEmail();
        // Construct the email content
        String formattedCancellationDate = cancellationDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String emailContent = String.format(
                "<p>Dear %s,</p>" +
                        "<p>We regret to inform you that the order for the book <strong>%s</strong> has been canceled.</p>" +
                        "<p>The book was reserved for you but was not picked up yesterday. As a result, the reservation was canceled on <strong>%s</strong>.</p>" +
                        "<p>We encourage you to place a new order if you still wish to borrow the book.</p>" +
                        "<p>Best regards,<br/>Blib Library</p>",
                sendToSub.getFullName(), book.getBookTitle(), formattedCancellationDate);
        // Send the email
        SendEmail(emailContent, to);
    }


    /**
     * Description:
     * Method for sending an email from the system
     *
     * @param emailContent String.class
     * @param to           String.class
     */
    private static void SendEmail(String emailContent, String to) {
        //set library email adress
        String from = "blibproject@gmail.com";
        //add username and app password for sending the email
        final String username = "blibproject@gmail.com";
        final String password = "fkhv nilh tbuh cyql";//generated password
        //set the host to be gamil
        String host = "smtp.gmail.com";
        //set mail server properties
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", "587");
        // Get the Session object.
        Session session = Session.getInstance(props,
                // authenticate that the user name and password are correct
                new jakarta.mail.Authenticator() {
                    protected PasswordAuthentication getPasswordAuthentication() {
                        return new PasswordAuthentication(username, password);
                    }
                });
        try {
            // Create a default MimeMessage object.
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(from));
            message.setRecipients(Message.RecipientType.TO,
                    InternetAddress.parse(to));
            message.setSubject("Book Return Reminder");
            // Set the content with HTML formatting
            message.setContent(emailContent, "text/html");
            // Send message
            Transport.send(message);
            System.out.println("Sent message successfully....");
        } catch (MessagingException e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        }
    }
}