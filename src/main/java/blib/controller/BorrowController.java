package blib.controller;

import blib.logic.BookLogic;
import blib.logic.BorrowLogic;
import blib.logic.ExtensionLogic;
import blib.logic.InvoiceLogic;
import blib.logic.ReportLogic;
import blib.logic.MemberLogic;
import blib.model.Book;
import blib.model.BorrowHistory;
import blib.model.BorrowTracking;
import blib.model.BorrowedBook;
import blib.model.BookCopy;
import blib.model.Member;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import blib.dto.BorrowRequest;
import blib.dto.ChangeReturnDateRequest;
import blib.enums.BorrowStatus;
import blib.enums.InvoiceSubject;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/borrows")
public class BorrowController {
    
    private final BorrowLogic borrowLogic = new BorrowLogic();
    private final BookLogic bookLogic = new BookLogic();
    private final ReportLogic reportLogic = new ReportLogic();
    private final MemberLogic memberLogic = new MemberLogic();
    private final ExtensionLogic extensionLogic = new ExtensionLogic();
    private final InvoiceLogic invoiceLogic = new InvoiceLogic();
    
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // borrow a book
    @PostMapping("/")
    public ResponseEntity<?> borrowBook(@RequestBody BorrowRequest request) {
        BorrowedBook book = borrowLogic.borrowBook(
            request.getMemberId(), 
            request.getBookCopyId(), 
            request.getLibrarianId(), 
            request.getLibrarianName()
        );

        if(book != null){
            Member member = memberLogic.fetchMemberById(request.getMemberId());

            reportLogic.saveBorrowHistory(new BorrowHistory(
                member.getMemberId(), 
                book.getNameOfBook(),
                member.getFullName(), 
                book.getBorrowDate(), 
                book.getReturnDate(),
                request.getBookCopyId()
            ));
            reportLogic.updateBorrowTracking(new BorrowTracking(LocalDate.now(), 1, 0));
            
            return ResponseEntity.ok(book);
        }
        return ResponseEntity.badRequest().body("Borrow process failed.");
    }

    // view all borrowed books of a specific member
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<BorrowedBook>> getBorrowedBooks(@PathVariable int memberId){
        List<BorrowedBook> suBorrowedBooks = borrowLogic.importBorrowedBooks(memberId);
        return ResponseEntity.ok(suBorrowedBooks);
    }

    // extending due date
    @PutMapping("/due-date-extension")
    public ResponseEntity<String> dueDateExtenstion(@RequestBody ChangeReturnDateRequest request){
        try {
            LocalDate extendedDueDate = LocalDate.parse(request.getNewReturnDate(), formatter);
            LocalDate extensionApprovalDate = LocalDate.parse(request.getExtensionDate(), formatter);

            boolean updatedReturnDate = borrowLogic.setReturnDate(
                request.getMemberId(),
                request.getBookCopyId(),
                extendedDueDate
            );

            boolean opLibrarian = borrowLogic.setLibrarianForReturnDate(
                request.getMemberId(),
                request.getBookCopyId(),
                request.getLibrarianName(),
                request.getLibrarianId(),
                extensionApprovalDate
            );

            if(updatedReturnDate && opLibrarian){
                BorrowedBook book = borrowLogic.fetchBorrowedBook(
                    request.getMemberId(),
                    request.getBookCopyId()
                );

                reportLogic.updateOriginalReturnDate(
                    request.getMemberId(),
                    request.getBookCopyId(),
                    book.getBorrowDate(),
                    extendedDueDate
                );
                return ResponseEntity.ok("Due date successfully changed.");
            }
            return ResponseEntity.badRequest().body("Failed to change due date.");
        } catch(Exception e){
            return ResponseEntity.status(500).body(e.toString());
        }
    }

    // due date extension request
    @PutMapping("/member/{memberId}/book/{copyOfBookId}/extend")
    public ResponseEntity<String> extendBorrow(@PathVariable int memberId, @PathVariable int copyOfBookId){
        BorrowedBook book = borrowLogic.fetchBorrowedBook(memberId, copyOfBookId);
        
        if (book == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isExtend = extensionLogic.borrowExtensionRequest(book);
        if(isExtend){
            BorrowedBook exBook = borrowLogic.fetchBorrowedBook(memberId, copyOfBookId);
            reportLogic.updateOriginalReturnDate(memberId, copyOfBookId, exBook.getBorrowDate(), exBook.getReturnDate());
        
            Member member = memberLogic.fetchMemberById(memberId);
            String notification = "Member " + member.getFullName() + "has extended the due date of the book \"" +
                exBook.getNameOfBook() + "\". Please notice the change in his Activity List.";
            
            invoiceLogic.sendMessage(memberId, member.getUsername(), member.getFullName(), InvoiceSubject.EXTENSION, notification);

            return ResponseEntity.ok("Borrow successfully extended.");
        }
        return ResponseEntity.badRequest().body("Extension failed or rejected.");
    }

    // a borrowed book was returned - delete it from "borrowed"
    @DeleteMapping("/copy/{copyOfBookId}/member/{memberId}")
    public ResponseEntity<String> deleteBorrowedBook(@PathVariable int copyOfBookId, @PathVariable int memberId){
        BorrowedBook book = borrowLogic.fetchBorrowedBook(memberId, copyOfBookId);

        if(book != null){
            boolean delBook = borrowLogic.deleteBorrowedBook(copyOfBookId); 
            if(delBook){
                BookCopy delBookCopyId = bookLogic.findCopyOfBook(copyOfBookId);
                delBookCopyId.setBorrowStatus(BorrowStatus.NOT_BORROWED);
                bookLogic.changeBookCopyBorrowStatus(delBookCopyId);

                reportLogic.updateBorrowTracking(new BorrowTracking(LocalDate.now(), -1, 0));
                reportLogic.updateActualReturnDate(memberId, copyOfBookId, book.getBorrowDate(), LocalDate.now());

                return ResponseEntity.ok("Borrowed book deleted and stock updated.");
            }
        }
        return ResponseEntity.badRequest().body("Failed to delete borrowed book.");
    }

    // find a book copy which can be borrowed
    @GetMapping("/book/{bookId}/available-copy/member/{memberId}")
    public ResponseEntity<BookCopy> findAvailableCopy(@PathVariable int bookId, @PathVariable int memberId){
        BookCopy availableBookCopy = bookLogic.getAvailableCopyOfBook(bookId);

        if(availableBookCopy != null){
            Book book = bookLogic.fetchBook(bookId);
            boolean isNotReserved = borrowLogic.checkIfAMemberCanBorrowTheBook(memberId, availableBookCopy, book);
        
            if(isNotReserved){
                return ResponseEntity.ok(availableBookCopy);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // view closest return date of a book from all its copies
    @GetMapping("/book/{bookId}/closest-return-date")
    public ResponseEntity<BorrowedBook> getClosestReturnDate(@PathVariable int bookId){
        BorrowedBook closestBook = borrowLogic.getCloserReturnDateBook(bookId);
        if(closestBook != null){
            return ResponseEntity.ok(closestBook);
        }
        return ResponseEntity.notFound().build();
    }

    // reduce number of borrowed copies
    @PutMapping("/book/{bookId}/decrease-copies")
    public ResponseEntity<String> decreaseBorrowedCopies(@PathVariable int bookId){
        try{
            boolean decrease = bookLogic.decreaseBorrowedCopies(bookId);

            if(decrease){
                return ResponseEntity.ok("Decreased copies amount by 1.");
            }
            return ResponseEntity.badRequest().body("Decrease failed.");
        } catch(Exception e){
            return ResponseEntity.status(500).body(e.toString());
        }
    }
}
