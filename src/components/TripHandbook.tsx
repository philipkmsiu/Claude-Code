import type { TripHandbook } from '../data/types'

type Props = {
  handbook: TripHandbook
  destinationName: string
}

export function TripHandbookPanel({ handbook, destinationName }: Props) {
  return (
    <div className="handbook-stack">
      {handbook.summary?.length ? (
        <article className="info-block wide handbook-block">
          <h3>行程摘要</h3>
          <ul className="tips-list">
            {handbook.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      ) : null}

      {handbook.photos && handbook.photos.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>目的地參考相片</h3>
          <p className="muted-line">{destinationName} 精華景點視覺參考（規劃書相片版）。</p>
          <div className="handbook-photo-grid">
            {handbook.photos.map((photo) => (
              <figure key={photo.src} className="handbook-photo">
                <img src={photo.src} alt={photo.title} loading="lazy" />
                <figcaption>
                  <strong>{photo.title}</strong>
                  <span>{photo.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </article>
      ) : null}

      {handbook.hotelGuide && handbook.hotelGuide.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>酒店建議與價格</h3>
          {handbook.hotelBudgetNotes?.length ? (
            <ul className="tips-list compact">
              {handbook.hotelBudgetNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          <div className="hotel-guide-table-wrap">
            <table className="hotel-guide-table">
              <thead>
                <tr>
                  <th>地點</th>
                  <th>晚數</th>
                  <th>首選方向</th>
                  <th>每晚預算</th>
                  <th>重點</th>
                </tr>
              </thead>
              <tbody>
                {handbook.hotelGuide.map((row) => (
                  <tr key={`${row.place}-${row.name}`}>
                    <td>
                      {row.place}
                      {row.needsMedia ? <em className="media-tag">需影片</em> : null}
                    </td>
                    <td>{row.nights}</td>
                    <td>{row.name}</td>
                    <td>{row.pricePerNight}</td>
                    <td>{row.highlight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {handbook.photoStops && handbook.photoStops.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>需要 planner 提供照片及影片的住宿站</h3>
          <ul className="tips-list">
            {handbook.photoStops.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}

      {handbook.charterRequirements && handbook.charterRequirements.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>包車與 planner 要求</h3>
          <ul className="tips-list">
            {handbook.charterRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}

      {handbook.taobaoSearchTerms && handbook.taobaoSearchTerms.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>淘寶 App 建議搜尋字眼</h3>
          <div className="search-term-chips">
            {handbook.taobaoSearchTerms.map((term) => (
              <button
                key={term}
                type="button"
                className="chip search-term"
                onClick={() => void copyText(term)}
                title="點擊複製"
              >
                {term}
              </button>
            ))}
          </div>
        </article>
      ) : null}

      {handbook.quoteCompareItems && handbook.quoteCompareItems.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>向 planner 詢價時要比較的項目</h3>
          <ol className="checklist-ol">
            {handbook.quoteCompareItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      ) : null}

      {handbook.inquiryDraft ? (
        <article className="info-block wide handbook-block">
          <h3>可直接發給淘寶 planner 的詢價文字</h3>
          <pre className="inquiry-draft">{handbook.inquiryDraft}</pre>
          <button
            type="button"
            className="btn ghost"
            onClick={() => void copyText(handbook.inquiryDraft || '')}
          >
            複製詢價文字
          </button>
        </article>
      ) : null}

      {handbook.offMainline && handbook.offMainline.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>暫不列入主線的地方</h3>
          <ul className="tips-list">
            {handbook.offMainline.map((item) => (
              <li key={item.name}>
                <strong>{item.name}：</strong>
                {item.reason}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {handbook.bookingChecklist && handbook.bookingChecklist.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>下訂前最後核對清單</h3>
          <ol className="checklist-ol">
            {handbook.bookingChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      ) : null}

      {handbook.remarks && handbook.remarks.length > 0 ? (
        <article className="info-block wide handbook-block">
          <h3>備註</h3>
          <ul className="tips-list">
            {handbook.remarks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
  }
}
