import WhatsappLink from './whatsappLink';

export default function PhoneContentData({ info, message }) {
  return (
    <td className="px-4 py-3">
      {info.phone ? (
        <WhatsappLink phone={info.phone} message={message} />
      ) : (
        '---'
      )}
    </td>
  );
}
