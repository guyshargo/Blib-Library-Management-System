package oak.enums;

public enum InvoiceSubject {
    GENERAL_MESSAGE("General"), 
    EXTENSION("Extension");

    private String value;

    InvoiceSubject(String value) {
        this.value = value;
    }

    public String toString() { return this.value; }
}