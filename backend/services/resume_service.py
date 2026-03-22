from utils.pdf_parser import extract_text_from_pdf

def parse_resume(file):
    text = extract_text_from_pdf(file)
    return {
        "raw_text": text,
        "preview": text[:1000]
    }