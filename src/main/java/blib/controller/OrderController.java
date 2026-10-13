package blib.controller;

import blib.logic.BookLogic;
import blib.logic.OrderLogic;

import blib.model.OrderedBook;
import blib.dto.OrderRequest;
import blib.enums.ArrivalStatus;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final BookLogic bookLogic = new BookLogic();
    private final OrderLogic orderLogic = new OrderLogic();

    // view all book orders of a specific member
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<OrderedBook>> getAllOrderedBooks(@PathVariable int memberId){
        List<OrderedBook> memberOrderedBooks = orderLogic.importOrderedBooks(memberId);
        return ResponseEntity.ok(memberOrderedBooks);
    }

    // ordering a book
    @PostMapping("/")
    public ResponseEntity<String> orderBook(@RequestBody OrderRequest request){
        try{
            String orderMessage = orderLogic.orderBook(
                request.getBookId(),
                request.getMemberId(),
                request.getMemberName(),
                request.getMemberPhone(),
                request.getMemberEmail()
            );
            return ResponseEntity.ok(orderMessage);            
        } catch(Exception e){
            return ResponseEntity.status(500).body(e.toString());
        }
    }

    // cancel a book order
    @DeleteMapping("/{orderId}")
    public ResponseEntity<String> cancelOrder(@PathVariable int orderId, @RequestParam int bookId, @RequestParam ArrivalStatus arrivalStatus){
        blib.model.Book book = bookLogic.fetchBook(bookId);
        boolean isCanceled = orderLogic.cancelOrder(orderId);

        if(isCanceled){
            if (book != null && book.getNumberOforders() > 0) {
                bookLogic.changeBookOrderStatus(bookId, book.getNumberOforders(), false);
            }
            if(arrivalStatus == ArrivalStatus.ARRIVED){
                orderLogic.changeArrivalStatus(bookId);
            }
            return ResponseEntity.ok("Order successfully canceled.");
        }
        return ResponseEntity.badRequest().body("Failed to cancel order.");
    }

    // change if a book is ordered or not
    @PutMapping("/status")
    public ResponseEntity<String> changeOrderStatus(
            @RequestParam int bookId, 
            @RequestParam int numberOfOrders, 
            @RequestParam boolean increase) {
        
        boolean statusChanged = bookLogic.changeBookOrderStatus(bookId, numberOfOrders, increase);
        if (statusChanged) {
            return ResponseEntity.ok("Order status updated.");
        }
        return ResponseEntity.badRequest().body("Failed to update order status.");
    }

    //
    @PutMapping("/book/{bookId}/arrival-status")
    public ResponseEntity<String> changeArrivalStatus(@PathVariable int bookId) {
        try {
            boolean statusChanged = orderLogic.changeArrivalStatus(bookId);
            if (statusChanged) {
                return ResponseEntity.ok("Success");
            }
            return ResponseEntity.badRequest().body("Failure");
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.toString());
        }
    }
}
