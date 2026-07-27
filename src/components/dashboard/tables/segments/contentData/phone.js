import WhatsappLink from './whatsappLink';

export default function PhoneContentData({ info }) {
  return (
    <td className="px-4 py-3">
      {info.phone ? <WhatsappLink phone={info.phone} /> : '---'}
    </td>
  );
}
