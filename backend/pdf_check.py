import sys
import os
from pypdf import PdfReader

# --- Configuration ---
# Since you confirmed the PDF is in the 'forms' folder,
# we'll hardcode the path for the Barangay Clearance template.
PDF_FILE_PATH = "forms/barangay-clearance (1).pdf" 
# ---------------------

if not os.path.exists(PDF_FILE_PATH):
    print(f"Error: PDF template not found at {PDF_FILE_PATH}. Check your folder structure.")
    sys.exit(1)

try:
    reader = PdfReader(PDF_FILE_PATH)
    form_fields = reader.get_form_text_fields()

    print("\n--- PYTHON DIAGNOSTIC RESULTS ---")
    print("🚨🚨 COPY THE FIELD NAMES BELOW AND PASTE THEM INTO server.js 🚨🚨")

    if not form_fields:
        print("\n🛑 CRITICAL WARNING: No standard form fields were detected.")
        print("This PDF may need to be re-created using a proper PDF editor (like Adobe Acrobat Pro) to ensure fillable fields are present.")
    else:
        print("\n✅ Found the following form field names:")

        # Print the field names in a list
        field_list = [name for name in form_fields.keys()]
        print(field_list)

    print("-----------------------------------")

except Exception as e:
    print(f"An unexpected error occurred during PDF reading: {e}")