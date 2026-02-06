/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "form" | "submitting";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");

  const [englishName, setEnglishName] = useState("");
  const [chineseName, setChineseName] = useState("");
  const [countryCode, setCountryCode] = useState("60");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [postcode, setPostcode] = useState("");
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Country codes list
  const countryCodes: Record<string, string> = {"Afghanistan":"93","Albania":"355","Algeria":"213","Andorra":"376","Angola":"244","Argentina":"54","Armenia":"374","Australia":"61","Austria":"43","Azerbaijan":"994","Bahamas":"1-242","Bahrain":"973","Bangladesh":"880","Barbados":"1-246","Belarus":"375","Belgium":"32","Belize":"501","Benin":"229","Bhutan":"975","Bolivia":"591","Bosnia & Herzegovina":"387","Botswana":"267","Brazil":"55","Brunei":"673","Bulgaria":"359","Burkina Faso":"226","Burundi":"257","Cambodia":"855","Cameroon":"237","Canada":"1","Cape Verde":"238","Central African Republic":"236","Chad":"235","Chile":"56","China":"86","Colombia":"57","Comoros":"269","Congo, Democratic Republic":"243","Congo, Republic":"242","Costa Rica":"506","Croatia":"385","Cuba":"53","Cyprus":"357","Czech Republic":"420","Denmark":"45","Djibouti":"253","Dominica":"1-767","Dominican Republic":"1-809","Ecuador":"593","Egypt":"20","El Salvador":"503","Equatorial Guinea":"240","Eritrea":"291","Estonia":"372","Eswatini":"268","Ethiopia":"251","Fiji":"679","Finland":"358","France":"33","Gabon":"241","Gambia":"220","Georgia":"995","Germany":"49","Ghana":"233","Greece":"30","Grenada":"1-473","Guatemala":"502","Guinea":"224","Guinea-Bissau":"245","Guyana":"592","Haiti":"509","Honduras":"504","Hong Kong":"852","Hungary":"36","Iceland":"354","India":"91","Indonesia":"62","Iran":"98","Iraq":"964","Ireland":"353","Israel":"972","Italy":"39","Jamaica":"1-876","Japan":"81","Jordan":"962","Kazakhstan":"7","Kenya":"254","Kiribati":"686","Kuwait":"965","Kyrgyzstan":"996","Laos":"856","Latvia":"371","Lebanon":"961","Lesotho":"266","Liberia":"231","Libya":"218","Liechtenstein":"423","Lithuania":"370","Luxembourg":"352","Macau":"853","Madagascar":"261","Malawi":"265","Malaysia":"60","Maldives":"960","Mali":"223","Malta":"356","Marshall Islands":"692","Mauritania":"222","Mauritius":"230","Mexico":"52","Micronesia":"691","Moldova":"373","Monaco":"377","Mongolia":"976","Montenegro":"382","Morocco":"212","Mozambique":"258","Myanmar":"95","Namibia":"264","Nauru":"674","Nepal":"977","Netherlands":"31","New Zealand":"64","Nicaragua":"505","Niger":"227","Nigeria":"234","North Korea":"850","North Macedonia":"389","Norway":"47","Oman":"968","Pakistan":"92","Palau":"680","Panama":"507","Papua New Guinea":"675","Paraguay":"595","Peru":"51","Philippines":"63","Poland":"48","Portugal":"351","Qatar":"974","Romania":"40","Russia":"7","Rwanda":"250","Saint Kitts & Nevis":"1-869","Saint Lucia":"1-758","Saint Vincent & Grenadines":"1-784","Samoa":"685","San Marino":"378","Sao Tome & Principe":"239","Saudi Arabia":"966","Senegal":"221","Serbia":"381","Seychelles":"248","Sierra Leone":"232","Singapore":"65","Slovakia":"421","Slovenia":"386","Solomon Islands":"677","Somalia":"252","South Africa":"27","South Korea":"82","South Sudan":"211","Spain":"34","Sri Lanka":"94","Sudan":"249","Suriname":"597","Sweden":"46","Switzerland":"41","Syria":"963","Taiwan":"886","Tajikistan":"992","Tanzania":"255","Thailand":"66","Timor-Leste":"670","Togo":"228","Tonga":"676","Trinidad & Tobago":"1-868","Tunisia":"216","Turkey":"90","Turkmenistan":"993","Tuvalu":"688","Uganda":"256","Ukraine":"380","United Arab Emirates":"971","United Kingdom":"44","United States":"1","Uruguay":"598","Uzbekistan":"998","Vanuatu":"678","Vatican City":"379","Venezuela":"58","Vietnam":"84","Yemen":"967","Zambia":"260","Zimbabwe":"263"};

  // Format phone number: remove leading 0 and prepend country code
  const formatPhoneNumber = (phone: string, code: string): string => {
    let cleaned = phone.trim().replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    // Remove dashes from country code (e.g., "1-242" -> "1242")
    const cleanedCode = code.replace("-", "");
    return cleanedCode + cleaned;
  };

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!englishName.trim() || !phoneNumber.trim()) {
      setError("English Name and Phone Number are required.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setStep("submitting");
    try {
      const res = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "skip-photo": "true" },
        body: JSON.stringify({
          englishName: englishName.trim(),
          chineseName: chineseName.trim() || undefined,
          phoneNumber: formatPhoneNumber(phoneNumber, countryCode),
          postcode: postcode.trim() || undefined,
          email: email.trim() || undefined
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to process.");
      }
      const data = (await res.json()) as { token: string };
      router.push(`/result/${data.token}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
      setStep("form");
    }
  };

  return (
    <main className="relative flex flex-1 flex-col gap-4 min-h-screen px-4 py-6" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: `linear-gradient(to right, #00A3E0 1px, transparent 1px), linear-gradient(to bottom, #00A3E0 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      
      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 opacity-40" style={{ borderColor: '#00A3E0' }} />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 opacity-40" style={{ borderColor: '#00A3E0' }} />

      <header className="relative z-10 pt-2">
        <h1 className="text-center text-2xl font-semibold tracking-wide" style={{ 
          background: 'linear-gradient(135deg, #0066B3, #00A3E0, #6DD5ED)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Memorable Moment Capture
        </h1>
        <p className="mt-1 text-center text-sm tracking-wider" style={{ color: '#6DD5ED', opacity: 0.8 }}>
          Capture your special moment, personalize it, and receive a QR code to
          download.
        </p>
      </header>

      {error && (
        <div className="relative z-10 rounded-md border px-3 py-2 text-sm" style={{ borderColor: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      {step === "form" && (
        <form
          className="relative z-10 mt-2 flex flex-col gap-3 rounded-xl p-4" 
          style={{ backgroundColor: 'rgba(10,10,15,0.8)', border: '1px solid rgba(0,163,224,0.3)', boxShadow: '0 0 20px rgba(0,163,224,0.1)' }}
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#6DD5ED' }}>
              English Name <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <input
              className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1" 
              style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)', color: '#fff' }}
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#6DD5ED' }}>Chinese Name</label>
            <input
              className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1" 
              style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)', color: '#fff' }}
              value={chineseName}
              onChange={(e) => setChineseName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#6DD5ED' }}>
              Phone Number <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <div className="flex gap-2">
              <select
                className="w-32 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-1" 
                style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)', color: '#fff' }}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                {Object.entries(countryCodes)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([country, code]) => (
                    <option key={country} value={code} style={{ backgroundColor: '#0a0a0f' }}>
                      +{code} ({country})
                    </option>
                  ))}
              </select>
              <input
                className="flex-1 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1" 
                style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)', color: '#fff' }}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                inputMode="numeric"
                placeholder="121234567"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#6DD5ED' }}>Postcode</label>
            <input
              className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1" 
              style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)', color: '#fff' }}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              inputMode="numeric"
              placeholder="11700"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#6DD5ED' }}>Email</label>
            <input
              type="email"
              className="rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1" 
              style={{ backgroundColor: 'rgba(0,163,224,0.1)', border: '1px solid rgba(0,163,224,0.3)', color: '#fff' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-start gap-2 mt-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded"
              style={{ accentColor: '#00A3E0' }}
              required
            />
            <label htmlFor="terms" className="text-sm" style={{ color: '#6DD5ED' }}>
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="underline hover:opacity-80"
                style={{ color: '#00A3E0' }}
              >
                Terms & Conditions
              </Link>
              <span style={{ color: '#ff6b6b' }}> *</span>
            </label>
          </div>

          {/* Privacy Summary */}
          <div className="mt-2 p-3 rounded-md text-xs" style={{ backgroundColor: 'rgba(0,163,224,0.05)', border: '1px solid rgba(0,163,224,0.2)', color: 'rgba(109,213,237,0.8)' }}>
            <p>
              <strong style={{ color: '#6DD5ED' }}>Privacy & PDPA Compliance</strong><br />
              VWord respects your privacy. In accordance with the PDPA 2010, all information collected via vword.net is used strictly for internal purposes. We do not share or sell your data. By using this site, you agree to our{" "}
              <Link
                href="/terms"
                target="_blank"
                className="underline hover:opacity-80"
                style={{ color: '#00A3E0' }}
              >
                Terms & Conditions
              </Link>.
            </p>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={!agreedToTerms}
              className="flex-1 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: agreedToTerms ? 'linear-gradient(135deg, #0066B3, #00A3E0)' : 'rgba(100,100,100,0.5)', boxShadow: agreedToTerms ? '0 0 20px rgba(0,163,224,0.4)' : 'none' }}
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {step === "submitting" && (
        <div className="relative z-10 mt-10 flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: 'rgba(0,163,224,0.3)', borderTopColor: '#00A3E0' }} />
          <p style={{ color: '#6DD5ED' }}>Generating your moment...</p>
        </div>
      )}
    </main>
  );
}


