import pdfplumber

with pdfplumber.open(r'c:\Users\JulianoSilva\Downloads\FechadoBalanço-Canvas.pdf') as pdf:
    text = ''
    for page in pdf.pages:
        text += page.extract_text() + '\n'

print(text)