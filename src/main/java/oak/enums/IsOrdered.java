package oak.enums;

public enum IsOrdered {
    YES(true), 
    NO(false);

    private final boolean value;

    IsOrdered(boolean value) { this.value = value; }

    public boolean getValue() { return value; }

    @Override
    public String toString() { return this.name(); }
}