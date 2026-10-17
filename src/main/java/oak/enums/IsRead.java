package oak.enums;

public enum IsRead {
    READ(true), 
    NOT_READ(false);

    private final boolean value;

    IsRead(boolean value) {
        this.value = value;
    }

    public String getStringValue() {
        if (value)
            return "Read";
        else
            return "notRead";
    }

    public boolean getValue() { return value; }

    public String toString() {
        if (value)
            return "Read";
        else
            return "Not Read";
    }
}