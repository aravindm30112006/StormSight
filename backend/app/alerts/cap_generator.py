from xml.etree.ElementTree import Element, SubElement, tostring
from datetime import datetime, timezone

class CAPGenerator:
    @staticmethod
    def generate_cap_xml(alerts):
        cap = Element('alert', xmlns="urn:oasis:names:tc:emergency:cap:1.2")
        identifier = SubElement(cap, 'identifier')
        identifier.text = f"WMO-OID-IN-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        sender = SubElement(cap, 'sender')
        sender.text = "imd.gov.in"
        sent = SubElement(cap, 'sent')
        sent.text = datetime.now(timezone.utc).isoformat()
        status = SubElement(cap, 'status')
        status.text = "Actual"
        msgType = SubElement(cap, 'msgType')
        msgType.text = "Alert"
        scope = SubElement(cap, 'scope')
        scope.text = "Public"
        for alert_data in alerts:
            info = SubElement(cap, 'info')
            category = SubElement(info, 'category')
            category.text = "Met"
            event = SubElement(info, 'event')
            event.text = "Thunderstorm"
            urgency = SubElement(info, 'urgency')
            urgency.text = "Expected"
            severity = SubElement(info, 'severity')
            severity.text = alert_data.get("severity", "Severe")
            certainty = SubElement(info, 'certainty')
            certainty.text = "Likely"
            senderName = SubElement(info, 'senderName')
            senderName.text = "India Meteorological Department"
            headline = SubElement(info, 'headline')
            headline.text = alert_data.get("message", "")
            area = SubElement(info, 'area')
            areaDesc = SubElement(area, 'areaDesc')
            areaDesc.text = f"{alert_data.get('district')}, {alert_data.get('state')}"
        return tostring(cap, encoding='unicode')
