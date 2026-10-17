package oak.enums;

public enum ArrivalStatus {
    ARRIVED(true), 
    NOT_ARRIVED(false);

    private final boolean value;

    ArrivalStatus(boolean value) {
        this.value = value;
    }

    public boolean getValue() { return value; }

    public String toString() {
        if (value)
            return "Arrived";
        else
            return "Not Arrived";
    }
}