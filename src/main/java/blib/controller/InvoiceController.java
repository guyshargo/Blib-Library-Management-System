package blib.controller;

import blib.logic.InvoiceLogic;
import blib.model.InvoiceMessage;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin
public class InvoiceController {

    private final InvoiceLogic invoiceLogic = new InvoiceLogic();

    @GetMapping("/")
    public ResponseEntity<List<InvoiceMessage>> importInvoiceMessages() {
        List<InvoiceMessage> invoiceList = invoiceLogic.importMessages();
        return ResponseEntity.ok(invoiceList);
    }

    @PutMapping("/{id}/read-status")
    public ResponseEntity<String> changeReadStatus(@PathVariable int id) {
        try {
            invoiceLogic.readMessage(id);
            return ResponseEntity.ok("Message read status updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.toString());
        }
    }
}