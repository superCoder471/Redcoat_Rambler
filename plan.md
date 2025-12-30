# Plan: Make Entire Card Clickable for "Read More" Buttons

## Information Gathered:
- Current structure has "Read More" buttons that are only clickable as text links
- Found in index.html (story-card elements) and archive.html (archive-item elements)
- Both use anchor tags inside article elements: `<a href="article.html">Read More →</a>`
- Current CSS already provides hover effects on the cards

## Plan:
1. **HTML Structure Changes:**
   - Wrap entire card content in anchor tags
   - Convert `<article>` elements to use `<a>` as the main container
   - Update both index.html (story-card) and archive.html (archive-item)

2. **CSS Updates:**
   - Make anchor tags display as block elements to fill entire card
   - Ensure proper text styling is maintained
   - Keep existing hover effects and transitions

3. **Accessibility Considerations:**
   - Ensure proper semantic structure is maintained
   - Test that keyboard navigation still works

## Files to Edit:
- `index.html` - Update story-card structure
- `archive.html` - Update archive-item structure  
- `styles.css` - Update CSS for anchor-based cards

## Implementation Steps:
1. Update HTML structure for both pages
2. Update CSS to support anchor-based card layout
3. Test the implementation

## Followup:
- Test clickability of entire cards
- Verify hover effects work properly
- Ensure responsive behavior is maintained
