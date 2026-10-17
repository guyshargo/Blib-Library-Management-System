package oak.enums;

public enum BookSubject {
    FICTION("Fiction"),
    ROMANCE("Romance"),
    FANTASY("Fantasy"),
    SCI_FI("Sci-Fi"),
    MYSTERY("Mystery"),
    THRILLER("Thriller"),
    HORROR("Horror"),
    HISTORICAL_FICTION("Historical Fiction"),
    LITERATURE("Literature"),
    SCIENCE("Science"),
    HISTORY("History"),
    TECHNOLOGY("Technology"),
    MATHEMATICS("Mathematics"),
    ART("Art"),
    PHILOSOPHY("Philosophy"),
    HEALTH("Health"),
    PSYCHOLOGY("Psychology"),
    BUSINESS("Business"),
    TRAVEL("Travel");

    private final String displayValue;

    BookSubject(String displayValue) {
        this.displayValue = displayValue;
    }

    public String getDisplayValue() { return displayValue; }

    public static BookSubject fromString(String text) {
        if (text == null) return FICTION;
        for (BookSubject subject : BookSubject.values()) {
            if (subject.displayValue.equalsIgnoreCase(text.trim())) {
                return subject;
            }
        }
        return FICTION;
    }
}