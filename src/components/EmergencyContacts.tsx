import { ChevronLeft, Phone, Info } from 'lucide-react';
import { emergencyContacts } from '../data/emergencyContacts';

interface EmergencyContactsProps {
  onBack: () => void;
}

export function EmergencyContacts({ onBack }: EmergencyContactsProps) {
  // 按類別分組
  const groupedContacts = emergencyContacts.reduce((acc, contact) => {
    if (!acc[contact.category]) {
      acc[contact.category] = [];
    }
    acc[contact.category].push(contact);
    return acc;
  }, {} as Record<string, typeof emergencyContacts>);

  return (
    <div className="min-h-screen bg-washi pb-20">
      {/* 頂部導航 */}
      <div className="sticky top-0 z-50 bg-red-600 text-white px-4 py-4 flex items-center gap-3 shadow-md">
        <button
          onClick={onBack}
          className="p-2.5 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="返回行程"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Phone className="w-6 h-6" />
          緊急聯絡
        </h1>
      </div>

      {/* 聯絡人列表 */}
      <div className="p-4 space-y-6">
        {Object.entries(groupedContacts).map(([category, contacts]) => (
          <div key={category}>
            {/* 類別標題 */}
            <h2 className="font-bold text-ink text-lg mb-3 flex items-center gap-2">
              <div className="w-1 h-6 bg-red-600 rounded-full" />
              {category}
            </h2>

            {/* 聯絡卡片 */}
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="bg-washi-card border border-washi-border rounded-lg shadow-sm p-4"
                >
                  <h3 className="font-bold text-ink mb-1">{contact.name}</h3>

                  {contact.description && (
                    <p className="text-sm text-stone mb-2">{contact.description}</p>
                  )}

                  {/* 電話號碼（可點擊撥打）*/}
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium min-h-[48px]"
                  >
                    <Phone className="w-5 h-5" />
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 提示文字 */}
      <div className="p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium mb-1 flex items-center gap-1.5">
            <Info className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            使用提示
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800">
            <li>點擊電話號碼即可直接撥打</li>
            <li>飯店電話請依實際預訂資訊更新</li>
            <li>建議將此頁面加入書籤以便快速查看</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
