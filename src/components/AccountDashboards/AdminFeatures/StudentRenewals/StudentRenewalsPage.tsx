import { useStudentRenewals } from "../../../../context/StudentRenewalContext";

export const StudentRenewalsPage = () => {
  const {
    renewals,
    loading,
    error,
    loadRenewals,
    createRenewal,
    updateRenewal,
    removeRenewal,
    clearError,
  } = useStudentRenewals();

  const handleCreateRenewal = async () => {
    try {
      await createRenewal({
        student_id: 123,
        duration_months: 12,
        payment_date: "2025-06-22",
        expiration_date: "2026-06-22",
        amount_due: 1200.0,
        amount_paid: 1200.0,
        number_of_payments: 1,
        number_of_classes: 48,
        paid_to: "School Office",
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error)
    return (
      <div>
        Error: {error} <button onClick={clearError}>Clear</button>
      </div>
    );

  return (
    <div>
      <button onClick={() => loadRenewals()}>Load All Renewals</button>
      <button onClick={() => loadRenewals(123)}>Load Student 123 Renewals</button>
      <button onClick={handleCreateRenewal}>Create Renewal</button>

      {renewals.map((renewal) => (
        <div key={renewal.renewal_id}>
          <p>Renewal ID: {renewal.renewal_id}</p>
          <p>Amount: ${renewal.amount_due}</p>
          <button
            onClick={() => updateRenewal(renewal.renewal_id, { amount_paid: renewal.amount_due })}
          >
            Mark as Paid
          </button>
          <button onClick={() => removeRenewal(renewal.renewal_id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};
