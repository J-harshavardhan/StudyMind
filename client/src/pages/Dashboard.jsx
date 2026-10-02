import React from 'react';

export default function Dashboard() {
  const statCards = [
    { title: 'Notes', value: '—' },
    { title: 'Tasks done', value: '—' },
    { title: 'Problems solved', value: '—' },
    { title: 'Streak', value: '—' }
  ];

  return (
    <>
      <h1>Your learning dashboard</h1>
      <div className="row g-3 mt-2">
        {statCards.map((card) => (
          <div key={card.title} className="col-md-6 col-xl-3">
            <div className="card h-100 p-3">
              <div className="text-muted small text-uppercase">{card.title}</div>
              <h3 className="mt-3 mb-0 fw-bold">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
